<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\GradeLevel;
use App\Models\TeacherSlot;
use App\Models\User;
use App\Services\WalletService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class BookingLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected User $student;

    protected User $teacher;

    protected TeacherSlot $slot;

    protected Booking $booking;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-10-13 14:00:00'));
        Role::firstOrCreate(['name' => 'student']);
        Role::firstOrCreate(['name' => 'teacher']);

        $this->student = User::factory()->create();
        $this->student->assignRole('student');
        app(WalletService::class)->processTransaction($this->student, 200.00, 'deposit', 'Initial Deposit');

        $this->teacher = User::factory()->create();
        $this->teacher->assignRole('teacher');

        $grade = GradeLevel::create(['name' => 'Test Grade', 'session_price' => 100.00]);
        $this->student->studentProfile()->create(['grade_level_id' => $grade->id]);

        $this->slot = TeacherSlot::create([
            'teacher_id' => $this->teacher->id,
            'slot_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'booked',
        ]);

        $this->booking = Booking::create([
            'student_id' => $this->student->id,
            'booked_by_id' => $this->student->id,
            'teacher_id' => $this->teacher->id,
            'teacher_slot_id' => $this->slot->id,
            'booking_date' => now()->toDateString(),
            'session_price' => 100.00,
            'discount_amount' => 0,
            'net_paid' => 100.00,
            'status' => 'scheduled',
            'agora_channel' => 'test_channel',
        ]);

        // خصم المبلغ يدوياً من المحفظة لمحاكاة وضع الحجز الحقيقي
        app(WalletService::class)->processTransaction($this->student, -100.00, 'withdrawal', 'Booking payment');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_teacher_cannot_complete_scheduled_booking_directly()
    {
        $response = $this->actingAs($this->teacher)
            ->patchJson("/api/v1/bookings/{$this->booking->id}/complete");

        $response->assertStatus(400)
            ->assertJson(['status' => 'error'])
            ->assertJsonPath('message', 'لا يمكن إكمال الحصة قبل بدئها ودخول المعلم إلى الفصل.');

        $this->assertEquals('scheduled', $this->booking->refresh()->status);
        $this->assertEquals(0.00, (float) ($this->teacher->wallet?->balance ?? 0));
    }

    public function test_teacher_cannot_complete_future_in_progress_booking_before_start_time()
    {
        // الحصة في موعد مستقبلي، حتى لو كانت in_progress لا يُسمح بإكمالها
        $this->booking->update(['status' => 'in_progress', 'teacher_joined_at' => now()]);

        $response = $this->actingAs($this->teacher)
            ->patchJson("/api/v1/bookings/{$this->booking->id}/complete");

        $response->assertStatus(400)
            ->assertJson(['status' => 'error'])
            ->assertJsonPath('message', 'لا يمكن إكمال الحصة قبل حلول موعدها المحدد.');

        $this->assertEquals('in_progress', $this->booking->refresh()->status);
        $this->assertEquals(0.00, (float) ($this->teacher->wallet?->balance ?? 0));
    }

    public function test_teacher_can_complete_booking_and_earn_money()
    {
        // تعيين موعد الحصة ليكون قد حان وقته الفعلي
        $this->slot->update([
            'slot_date' => now()->toDateString(),
            'start_time' => now()->subMinutes(30)->format('H:i'),
            'end_time' => now()->addMinutes(30)->format('H:i'),
        ]);

        // الحصة تبدأ وتصبح in_progress عندما يدخل المعلم إلى الفصل
        $this->booking->update(['status' => 'in_progress', 'teacher_joined_at' => now()]);

        $response = $this->actingAs($this->teacher)
            ->patchJson("/api/v1/bookings/{$this->booking->id}/complete");

        $response->assertStatus(200)
            ->assertJson(['status' => 'success']);

        $this->assertEquals('completed', $this->booking->refresh()->status);

        // Teacher earns 80% of 100 = 80
        $this->assertEquals(80.00, $this->teacher->wallet->refresh()->balance);
    }

    public function test_cancelled_booking_cannot_be_accessed_nor_completed_and_yields_no_earnings()
    {
        // 1. إلغاء الحجز
        $this->actingAs($this->teacher)
            ->patchJson("/api/v1/bookings/{$this->booking->id}/cancel")
            ->assertOk();

        $this->assertEquals('cancelled', $this->booking->refresh()->status);

        // 2. محاولة الدخول إلى الفصل الافتراضي بعد الإلغاء -> تُرفض بـ 409
        $accessResponse = $this->actingAs($this->teacher)
            ->getJson("/api/v1/bookings/{$this->booking->id}/classroom");

        $accessResponse->assertStatus(409)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'هذه الحصة لم تعد متاحة للدخول (ملغاة أو منتهية).');

        // 3. محاولة تجديد التوكن بعد الإلغاء -> تُرفض بـ 409
        $refreshResponse = $this->actingAs($this->teacher)
            ->getJson("/api/v1/bookings/{$this->booking->id}/refresh-token");

        $refreshResponse->assertStatus(409)
            ->assertJsonPath('status', 'error');

        // 4. محاولة إنهاء الحصة وصرف الأرباح بعد الإلغاء -> تُرفض بـ 400 ولا تُصرف أي أرباح
        $completeResponse = $this->actingAs($this->teacher)
            ->patchJson("/api/v1/bookings/{$this->booking->id}/complete");

        $completeResponse->assertStatus(400)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'لا يمكن إكمال هذه الحصة لأنها ملغاة.');

        // رصيد المعلم يجب أن يبقى 0 تماماً
        $this->assertEquals(0.00, (float) ($this->teacher->wallet?->balance ?? 0));
    }

    public function test_teacher_can_cancel_booking_and_student_gets_refund()
    {
        $initialBalance = $this->student->wallet->balance; // Should be 100 after booking (200 - 100)

        $response = $this->actingAs($this->teacher)
            ->patchJson("/api/v1/bookings/{$this->booking->id}/cancel");

        $response->assertStatus(200)
            ->assertJson(['status' => 'success']);

        $this->assertEquals('cancelled', $this->booking->refresh()->status);
        $this->assertEquals('available', $this->slot->refresh()->status);

        // Student gets 100 back. Initial 200 - 100 (for booking) + 100 (refund) = 200
        $this->assertEquals(200.00, $this->student->wallet->refresh()->balance);
    }

    public function test_unauthorized_user_cannot_complete_booking()
    {
        /** @var User $otherTeacher */
        $otherTeacher = User::factory()->create();
        $otherTeacher->assignRole('teacher');

        $response = $this->actingAs($otherTeacher)
            ->patchJson("/api/v1/bookings/{$this->booking->id}/complete");

        $response->assertStatus(403);
    }

    public function test_student_can_list_their_bookings()
    {
        $response = $this->actingAs($this->student)
            ->getJson('/api/v1/bookings');

        $response->assertStatus(200)
            ->assertJsonStructure(['status', 'data'])
            ->assertJsonMissing(['password']);
    }

    public function test_booking_index_filters_by_status_with_correct_operator_precedence()
    {
        // Cancel the existing booking
        $this->booking->update(['status' => 'cancelled']);

        // Create a new active scheduled booking
        $newSlot = TeacherSlot::create([
            'teacher_id' => $this->teacher->id,
            'slot_date' => now()->addDays(3)->toDateString(),
            'start_time' => '12:00:00',
            'end_time' => '13:00:00',
            'status' => 'booked',
        ]);

        $scheduledBooking = Booking::create([
            'student_id' => $this->student->id,
            'teacher_id' => $this->teacher->id,
            'booked_by_id' => $this->student->id,
            'teacher_slot_id' => $newSlot->id,
            'booking_date' => now()->addDays(3)->toDateString(),
            'session_price' => 100,
            'net_paid' => 100,
            'agora_channel' => 'test-precedence-channel',
            'status' => 'scheduled',
        ]);

        // Filter only scheduled bookings
        $response = $this->actingAs($this->student)
            ->getJson('/api/v1/bookings?status=scheduled');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $scheduledBooking->id)
            ->assertJsonPath('data.data.0.status', 'scheduled');
    }

    public function test_teacher_cannot_complete_abandoned_booking_via_api()
    {
        $this->booking->update(['status' => 'abandoned']);

        $response = $this->actingAs($this->teacher)
            ->patchJson("/api/v1/bookings/{$this->booking->id}/complete");

        $response->assertStatus(400)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'هذه الحصة معلقة لدى الإدارة للمراجعة ولا يمكن إكمالها.');
    }

    public function test_user_cannot_cancel_abandoned_booking_via_api()
    {
        $this->booking->update(['status' => 'abandoned']);

        $response = $this->actingAs($this->teacher)
            ->patchJson("/api/v1/bookings/{$this->booking->id}/cancel");

        $response->assertStatus(400)
            ->assertJsonPath('status', 'error')
            ->assertJsonPath('message', 'هذه الحصة معلقة لدى الإدارة للمراجعة ولا يمكن إلغاؤها.');
    }
}
