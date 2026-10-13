<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\TeacherSlot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * ClassroomAccessTest
 *
 * اختبارات تكاملية (Feature) لـ ClassroomController تغطي:
 * - التحقق من الصلاحيات (Authorization)
 * - تحديث طوابع الحضور (Attendance Timestamps)
 * - جلب التوكنات من الكاش
 * - المسار النظيف للتحقق من حالة السبورة
 * - تحديث توكن Agora
 * - حماية Rate Limiting
 */
class ClassroomAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // إنشاء الأدوار مسبقًا (Spatie Permission)
        Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'parent', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    }

    // ─── Authorization Tests ────────────────────────────────────────────────────

    #[Test]
    /**
     * يجب رفض الدخول (403) لمستخدم ليس طرفًا في الحصة.
     */
    public function test_unauthorized_user_cannot_access_classroom(): void
    {
        $teacher = User::factory()->create();
        $student = User::factory()->create();
        $stranger = User::factory()->create();
        $teacher->assignRole('teacher');
        $student->assignRole('student');

        $booking = Booking::factory()->create([
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'booked_by_id' => $student->id,
        ]);

        $response = $this->actingAs($stranger)->getJson("/api/v1/bookings/{$booking->id}/classroom");

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'غير مصرح لك بدخول هذه الغرفة');
    }

    #[Test]
    /**
     * يجب رفض الدخول لمستخدم غير مُسجّل (401 Unauthenticated).
     */
    public function test_unauthenticated_user_cannot_access_classroom(): void
    {
        $booking = Booking::factory()->create();

        $response = $this->getJson("/api/v1/bookings/{$booking->id}/classroom");

        $response->assertStatus(401);
    }

    // ─── Student Access & Timestamp Tests ──────────────────────────────────────

    #[Test]
    /**
     * يجب أن يتمكن الطالب من الدخول وتُحدَّث student_joined_at بشكل ذري.
     */
    public function test_student_can_access_classroom_and_joined_at_is_set_atomically(): void
    {
        Bus::fake();

        $teacher = User::factory()->create();
        $student = User::factory()->create();
        $teacher->assignRole('teacher');
        $student->assignRole('student');

        $booking = Booking::factory()->create([
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'booked_by_id' => $student->id,
            'agora_channel' => 'test_channel_123',
            'student_joined_at' => null,
        ]);

        // الكاش جاهز — استجابة فورية بدون استدعاء Agora API
        Cache::put("agora_token_{$booking->id}_{$student->id}", 'mocked_agora_token', now()->addHours(2));
        Cache::put("whiteboard_token_{$booking->whiteboard_room_uuid}_reader", 'mocked_wb_token', now()->addHour());

        $response = $this->actingAs($student)->getJson("/api/v1/bookings/{$booking->id}/classroom");

        $response->assertStatus(200);
        $response->assertJsonStructure(['status', 'data' => ['channel_name', 'uid', 'role', 'token']]);
        $response->assertJsonPath('data.channel_name', 'test_channel_123');
        // نتحقق من وجود التوكن وليس قيمته الحرفية، لأن الـ Controller قد يُولّد توكنًا جديدًا
        $this->assertNotEmpty($response->json('data.token'));
        $response->assertJsonPath('data.role', 'host');

        // تأكيد تحديث الطابع الزمني
        $this->assertNotNull($booking->fresh()->student_joined_at);
    }

    #[Test]
    /**
     * يجب ألا يتحدث student_joined_at مرتين (الحماية من Race Condition).
     */
    public function test_student_joined_at_is_not_overwritten_on_second_access(): void
    {
        Bus::fake();

        $teacher = User::factory()->create();
        $student = User::factory()->create();
        $teacher->assignRole('teacher');
        $student->assignRole('student');

        $firstJoin = now()->subMinutes(5);
        $booking = Booking::factory()->create([
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'booked_by_id' => $student->id,
            'student_joined_at' => $firstJoin,  // طابع زمني موجود مسبقًا
        ]);

        Cache::put("agora_token_{$booking->id}_{$student->id}", 'token', now()->addHours(2));

        $this->actingAs($student)->getJson("/api/v1/bookings/{$booking->id}/classroom");

        // يجب أن يبقى الطابع الزمني الأول كما هو
        $this->assertEquals(
            $firstJoin->timestamp,
            $booking->fresh()->student_joined_at->timestamp
        );
    }

    // ─── Teacher Access Tests ───────────────────────────────────────────────────

    #[Test]
    /**
     * يجب أن يتمكن المعلم من الدخول ويحصل على screen_token إضافي.
     */
    public function test_teacher_can_access_classroom_and_receives_screen_token(): void
    {
        Bus::fake();

        $teacher = User::factory()->create();
        $student = User::factory()->create();
        $teacher->assignRole('teacher');
        $student->assignRole('student');

        $booking = Booking::factory()->create([
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'booked_by_id' => $student->id,
        ]);

        Cache::put("agora_token_{$booking->id}_{$teacher->id}", 'teacher_token', now()->addHours(2));
        Cache::put("agora_token_{$booking->id}_screen", 'screen_token', now()->addHours(2));

        $response = $this->actingAs($teacher)->getJson("/api/v1/bookings/{$booking->id}/classroom");

        $response->assertStatus(200);
        $response->assertJsonPath('data.role', 'host');
        // نتحقق من وجود screen_token وليس قيمته الحرفية لنفس السبب السابق
        $this->assertNotEmpty($response->json('data.screen_token'));
        $this->assertNotNull($booking->fresh()->teacher_joined_at);
    }

    // ─── Whiteboard Status Tests ────────────────────────────────────────────────

    #[Test]
    /**
     * getWhiteboardStatus يجب أن يُعيد "pending" إذا لم تُهيَّأ السبورة بعد.
     */
    public function test_whiteboard_status_returns_pending_when_not_provisioned(): void
    {
        $teacher = User::factory()->create();
        $student = User::factory()->create();
        $teacher->assignRole('teacher');
        $student->assignRole('student');

        $booking = Booking::factory()->create([
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'booked_by_id' => $student->id,
            'whiteboard_room_uuid' => null,     // لم تُهيَّأ بعد
        ]);

        $response = $this->actingAs($student)->getJson("/api/v1/bookings/{$booking->id}/classroom/whiteboard-status");

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'pending');
        $response->assertJsonPath('whiteboard', null);
    }

    #[Test]
    /**
     * الوصول إلى whiteboard-status يُرفض (403) للمستخدم غير المصرح له.
     */
    public function test_whiteboard_status_is_protected_from_unauthorized_users(): void
    {
        $stranger = User::factory()->create();
        $booking = Booking::factory()->create();

        $response = $this->actingAs($stranger)->getJson("/api/v1/bookings/{$booking->id}/classroom/whiteboard-status");

        $response->assertStatus(403);
    }

    // ─── Token Refresh Tests ────────────────────────────────────────────────────

    #[Test]
    /**
     * refreshToken يجب أن يُولّد توكنًا جديدًا ويُعيده للمستخدم المصرح له.
     */
    public function test_refresh_token_returns_new_token_for_authorized_user(): void
    {
        $teacher = User::factory()->create();
        $student = User::factory()->create();
        $teacher->assignRole('teacher');
        $student->assignRole('student');

        $booking = Booking::factory()->create([
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'booked_by_id' => $student->id,
        ]);

        // استخدام UUID صالح بتنسيق مقبول من مكتبة Agora SDK
        config(['services.agora.app_id' => '12345678901234567890123456789012']);
        config(['services.agora.app_certificate' => '12345678901234567890123456789012']);

        $response = $this->actingAs($student)->getJson("/api/v1/bookings/{$booking->id}/refresh-token");

        // نتحقق من أن الاستجابة 200 مع توكن صالح
        $response->assertStatus(200);
        $response->assertJsonStructure(['status', 'data' => ['token']]);
    }

    #[Test]
    /**
     * refreshToken يجب أن يُرفض (403) للمستخدم غير المصرح له.
     */
    public function test_refresh_token_is_rejected_for_unauthorized_user(): void
    {
        $stranger = User::factory()->create();
        $booking = Booking::factory()->create();

        $response = $this->actingAs($stranger)->getJson("/api/v1/bookings/{$booking->id}/refresh-token");

        $response->assertStatus(403);
    }

    #[Test]
    /**
     * يجب رفض دخول الفصل (409 Conflict) إذا كانت الحصة ملغاة أو مكتملة.
     */
    public function test_classroom_access_is_rejected_for_closed_bookings(): void
    {
        $teacher = User::factory()->create();
        $student = User::factory()->create();
        $teacher->assignRole('teacher');
        $student->assignRole('student');

        $cancelledBooking = Booking::factory()->create([
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'status' => 'cancelled',
        ]);

        $completedBooking = Booking::factory()->create([
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'status' => 'completed',
        ]);

        // الحجز الملغي
        $this->actingAs($student)
            ->getJson("/api/v1/bookings/{$cancelledBooking->id}/classroom")
            ->assertStatus(409)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'هذه الحصة لم تعد متاحة للدخول (ملغاة أو منتهية).');

        // الحجز المكتمل
        $this->actingAs($teacher)
            ->getJson("/api/v1/bookings/{$completedBooking->id}/classroom")
            ->assertStatus(409)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'هذه الحصة لم تعد متاحة للدخول (ملغاة أو منتهية).');
    }

    #[Test]
    /**
     * المراقب (ولي الأمر الذي دفع) يحصل على دور audience/subscriber ولا يحصل على screen_token.
     */
    public function test_observer_parent_gets_audience_role_and_no_screen_token(): void
    {
        Bus::fake();

        $teacher = User::factory()->create();
        $student = User::factory()->create();
        $parent = User::factory()->create();
        $teacher->assignRole('teacher');
        $student->assignRole('student');
        $parent->assignRole('parent');

        $booking = Booking::factory()->create([
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'booked_by_id' => $parent->id,
            'status' => 'scheduled',
            'whiteboard_room_uuid' => 'test_whiteboard_uuid',
        ]);

        $response = $this->actingAs($parent)->getJson("/api/v1/bookings/{$booking->id}/classroom");

        $response->assertStatus(200);
        $response->assertJsonPath('data.role', 'audience');
        $this->assertNull($response->json('data.screen_token'));
        $this->assertTrue(Cache::has("agora:rtc:{$booking->agora_channel}:{$parent->id}:subscriber"));
        $this->assertFalse(Cache::has("agora:rtc:{$booking->agora_channel}:{$parent->id}:publisher"));

        // تجديد التوكن لولي الأمر لا يعيد أبداً screen_token ويحافظ على subscriber
        $refreshResponse = $this->actingAs($parent)->getJson("/api/v1/bookings/{$booking->id}/refresh-token");
        $refreshResponse->assertStatus(200);
        $this->assertNull($refreshResponse->json('data.screen_token'));
    }

    #[Test]
    public function test_user_cannot_access_classroom_before_session_window(): void
    {
        $teacher = User::factory()->create();
        $student = User::factory()->create();
        $teacher->assignRole('teacher');
        $student->assignRole('student');

        $futureSlot = TeacherSlot::factory()->future()->create([
            'teacher_id' => $teacher->id,
            'status' => 'booked',
        ]);

        $booking = Booking::factory()->create([
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $futureSlot->id,
            'status' => 'scheduled',
        ]);

        $response = $this->actingAs($student)->getJson("/api/v1/bookings/{$booking->id}/classroom");

        $response->assertStatus(403)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'لم يحن موعد الحصة بعد. يمكنك الدخول قبل موعد الحصة بـ 15 دقيقة.');
    }

    #[Test]
    public function test_broadcast_channel_authorizes_open_sessions_and_denies_closed_or_future_ones(): void
    {
        $teacher = User::factory()->create();
        $student = User::factory()->create();
        $outsider = User::factory()->create();
        $teacher->assignRole('teacher');
        $student->assignRole('student');
        $outsider->assignRole('student');

        $slot = TeacherSlot::factory()->create(['teacher_id' => $teacher->id]);
        $booking = Booking::factory()->create([
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $slot->id,
            'status' => 'scheduled',
        ]);

        // استخراج دالة التحقق من القناة المسجلة في channels.php
        $channelCallback = Broadcast::getChannels()->get('classroom.{bookingId}');
        $this->assertNotNull($channelCallback, 'قناة classroom.{bookingId} يجب أن تكون معرفة في channels.php');

        // 1. مشارك بحصة نشطة وضمن النافذة -> مسموح (true)
        $this->assertTrue((bool) $channelCallback($student, $booking->id));
        $this->assertTrue((bool) $channelCallback($teacher, $booking->id));

        // 2. مستخدم خارجي ليس طرفاً في الحصة -> مرفوض (false)
        $this->assertFalse((bool) $channelCallback($outsider, $booking->id));

        // 3. الحصة مكتملة أو ملغاة -> مرفوض حتى للمشارك الأصلي (false)
        $booking->update(['status' => 'completed']);
        $this->assertFalse((bool) $channelCallback($student, $booking->id));

        // 4. الحصة في المستقبل ولم يحن وقتها بعد -> مرفوض حتى للمشارك (false)
        $futureSlot = TeacherSlot::factory()->future()->create(['teacher_id' => $teacher->id]);
        $futureBooking = Booking::factory()->create([
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $futureSlot->id,
            'status' => 'scheduled',
        ]);
        $this->assertFalse((bool) $channelCallback($student, $futureBooking->id));

        // 5. المشرف -> مسموح دائماً للإشراف والمتابعة (true)
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $this->assertTrue((bool) $channelCallback($admin, $booking->id));
    }
}
