<?php

namespace Tests\Unit;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Booking;
use App\Models\TeacherSlot;
use App\Services\BookingService;
use App\Services\WalletService;
use Mockery;

class BookingServiceUnitTest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_booking_deposits_teacher_share()
    {
        $teacher = User::create(['name' => 'teacher', 'email' => 'teacher1@taj.com', 'phone' => '111', 'password' => '123']);
        $student = User::create(['name' => 'student', 'email' => 'student1@taj.com', 'phone' => '222', 'password' => '123']);

        $slot = TeacherSlot::create([
            'teacher_id' => $teacher->id,
            'slot_date' => now()->addDay(),
            'start_time' => '12:00:00',
            'end_time' => '13:00:00',
            'status' => 'booked',
        ]);

        $booking = Booking::create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $slot->id,
            'booking_date' => now(),
            'session_price' => 100.00,
            'discount_amount' => 0.00,
            'net_paid' => 100.00,
            'status' => 'scheduled',
            'agora_channel' => 'taj_test',
        ]);

        $walletServiceMock = Mockery::mock(WalletService::class);
        $walletServiceMock->shouldReceive('processTransaction')
            ->once()
            ->withArgs(function ($user, $amount, $type, $description, $bookingId) use ($teacher, $booking) {
                return $user->is($teacher)
                    && abs($amount - 80.0) < 0.001
                    && $type === 'class_earnings'
                    && $description === 'أرباح حصة منتهية رقم #' . $booking->id
                    && $bookingId === $booking->id;
            })
            ->andReturn(new \App\Models\WalletTransaction());

        $service = new BookingService($walletServiceMock);

        $result = $service->completeBooking($booking);

        $this->assertEquals('completed', $result->status);
        $this->assertNotNull($result->completed_at);
    }

    public function test_cancel_booking_refunds_payer_and_sets_slot_available()
    {
        $teacher = User::create(['name' => 'teacher', 'email' => 'teacher2@taj.com', 'phone' => '333', 'password' => '123']);
        $student = User::create(['name' => 'student', 'email' => 'student2@taj.com', 'phone' => '444', 'password' => '123']);

        $slot = TeacherSlot::create([
            'teacher_id' => $teacher->id,
            'slot_date' => now()->addDay(),
            'start_time' => '14:00:00',
            'end_time' => '15:00:00',
            'status' => 'booked',
        ]);

        $booking = Booking::create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $slot->id,
            'booking_date' => now(),
            'session_price' => 100.00,
            'discount_amount' => 0.00,
            'net_paid' => 100.00,
            'status' => 'scheduled',
            'agora_channel' => 'taj_test_cancel',
        ]);

        $walletServiceMock = Mockery::mock(WalletService::class);
        $walletServiceMock->shouldReceive('processTransaction')
            ->once()
            ->withArgs(function ($user, $amount, $type, $description, $bookingId) use ($student, $booking) {
                return $user->is($student)
                    && abs($amount - 100.0) < 0.001
                    && $type === 'refund'
                    && str_contains($description, 'استرجاع مالي لإلغاء الحصة رقم #' . $booking->id)
                    && $bookingId === $booking->id;
            })
            ->andReturn(new \App\Models\WalletTransaction());

        $service = new BookingService($walletServiceMock);

        $result = $service->cancelBooking($booking, $student);

        $this->assertEquals('cancelled', $result->status);
        $this->assertEquals('available', $slot->refresh()->status);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
