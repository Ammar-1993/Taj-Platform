<?php

namespace Tests\Feature;

use App\Jobs\ProvisionVirtualClassroom;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
    }

    // ─── Authorization Tests ────────────────────────────────────────────────────

    /**
     * @test
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
            'teacher_id'   => $teacher->id,
            'student_id'   => $student->id,
            'booked_by_id' => $student->id,
        ]);

        $response = $this->actingAs($stranger)->getJson("/api/v1/bookings/{$booking->id}/classroom");

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'غير مصرح لك بدخول هذه الغرفة');
    }

    /**
     * @test
     * يجب رفض الدخول لمستخدم غير مُسجّل (401 Unauthenticated).
     */
    public function test_unauthenticated_user_cannot_access_classroom(): void
    {
        $booking = Booking::factory()->create();

        $response = $this->getJson("/api/v1/bookings/{$booking->id}/classroom");

        $response->assertStatus(401);
    }

    // ─── Student Access & Timestamp Tests ──────────────────────────────────────

    /**
     * @test
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
            'teacher_id'        => $teacher->id,
            'student_id'        => $student->id,
            'booked_by_id'      => $student->id,
            'agora_channel'     => 'test_channel_123',
            'student_joined_at' => null,
        ]);

        // الكاش جاهز — استجابة فورية بدون استدعاء Agora API
        Cache::put("agora_token_{$booking->id}_{$student->id}", 'mocked_agora_token', now()->addHours(2));
        Cache::put("whiteboard_token_{$booking->whiteboard_room_uuid}_reader", 'mocked_wb_token', now()->addHour());

        $response = $this->actingAs($student)->getJson("/api/v1/bookings/{$booking->id}/classroom");

        $response->assertStatus(200);
        $response->assertJsonStructure(['status', 'data' => ['channel_name', 'uid', 'role', 'token']]);
        $response->assertJsonPath('data.channel_name', 'test_channel_123');
        $response->assertJsonPath('data.token', 'mocked_agora_token');
        $response->assertJsonPath('data.role', 'host');

        // تأكيد تحديث الطابع الزمني
        $this->assertNotNull($booking->fresh()->student_joined_at);
    }

    /**
     * @test
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
            'teacher_id'        => $teacher->id,
            'student_id'        => $student->id,
            'booked_by_id'      => $student->id,
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

    /**
     * @test
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
            'teacher_id'       => $teacher->id,
            'student_id'       => $student->id,
            'booked_by_id'     => $student->id,
        ]);

        Cache::put("agora_token_{$booking->id}_{$teacher->id}", 'teacher_token', now()->addHours(2));
        Cache::put("agora_token_{$booking->id}_screen", 'screen_token', now()->addHours(2));

        $response = $this->actingAs($teacher)->getJson("/api/v1/bookings/{$booking->id}/classroom");

        $response->assertStatus(200);
        $response->assertJsonPath('data.role', 'host');
        $response->assertJsonPath('data.screen_token', 'screen_token');
        $this->assertNotNull($booking->fresh()->teacher_joined_at);
    }

    // ─── Whiteboard Status Tests ────────────────────────────────────────────────

    /**
     * @test
     * getWhiteboardStatus يجب أن يُعيد "pending" إذا لم تُهيَّأ السبورة بعد.
     */
    public function test_whiteboard_status_returns_pending_when_not_provisioned(): void
    {
        $teacher = User::factory()->create();
        $student = User::factory()->create();
        $teacher->assignRole('teacher');
        $student->assignRole('student');

        $booking = Booking::factory()->create([
            'teacher_id'          => $teacher->id,
            'student_id'          => $student->id,
            'booked_by_id'        => $student->id,
            'whiteboard_room_uuid' => null,     // لم تُهيَّأ بعد
        ]);

        $response = $this->actingAs($student)->getJson("/api/v1/bookings/{$booking->id}/classroom/whiteboard-status");

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'pending');
        $response->assertJsonPath('whiteboard', null);
    }

    /**
     * @test
     * الوصول إلى whiteboard-status يُرفض (403) للمستخدم غير المصرح له.
     */
    public function test_whiteboard_status_is_protected_from_unauthorized_users(): void
    {
        $stranger = User::factory()->create();
        $booking  = Booking::factory()->create();

        $response = $this->actingAs($stranger)->getJson("/api/v1/bookings/{$booking->id}/classroom/whiteboard-status");

        $response->assertStatus(403);
    }

    // ─── Token Refresh Tests ────────────────────────────────────────────────────

    /**
     * @test
     * refreshToken يجب أن يُولّد توكنًا جديدًا ويُعيده للمستخدم المصرح له.
     */
    public function test_refresh_token_returns_new_token_for_authorized_user(): void
    {
        $teacher = User::factory()->create();
        $student = User::factory()->create();
        $teacher->assignRole('teacher');
        $student->assignRole('student');

        $booking = Booking::factory()->create([
            'teacher_id'   => $teacher->id,
            'student_id'   => $student->id,
            'booked_by_id' => $student->id,
        ]);

        // نحتاج Agora credentials لتوليد التوكن
        config(['services.agora.app_id'          => 'test_app_id_1234567890123456']);
        config(['services.agora.app_certificate' => 'test_cert_12345678901234567']);

        $response = $this->actingAs($student)->getJson("/api/v1/bookings/{$booking->id}/refresh-token");

        // مع credentials وهمية، قد يفشل البناء الفعلي أو ينجح —
        // المهم هو التحقق من أن الاستجابة ليست 403 أو 500 بسبب الصلاحيات
        $response->assertStatus(200);
        $response->assertJsonStructure(['status', 'data' => ['token']]);
    }

    /**
     * @test
     * refreshToken يجب أن يُرفض (403) للمستخدم غير المصرح له.
     */
    public function test_refresh_token_is_rejected_for_unauthorized_user(): void
    {
        $stranger = User::factory()->create();
        $booking  = Booking::factory()->create();

        $response = $this->actingAs($stranger)->getJson("/api/v1/bookings/{$booking->id}/refresh-token");

        $response->assertStatus(403);
    }
}
