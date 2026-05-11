<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\GradeLevel;
use App\Models\TeacherSlot;
use App\Models\User;
use App\Services\WalletService;
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

    public function test_teacher_can_complete_booking_and_earn_money()
    {
        $response = $this->actingAs($this->teacher)
            ->patchJson("/api/v1/bookings/{$this->booking->id}/complete");

        $response->assertStatus(200)
            ->assertJson(['status' => 'success']);

        $this->assertEquals('completed', $this->booking->refresh()->status);

        // Teacher earns 80% of 100 = 80
        $this->assertEquals(80.00, $this->teacher->wallet->refresh()->balance);
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
            ->assertJsonStructure(['status', 'data']);
    }
}
