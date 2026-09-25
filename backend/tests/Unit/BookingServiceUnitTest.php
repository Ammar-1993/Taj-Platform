<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Models\TeacherSlot;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\BookingService;
use App\Services\WalletService;
use App\Services\WhiteboardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

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
        $whiteboardServiceMock = Mockery::mock(WhiteboardService::class);
        $walletServiceMock->shouldReceive('processTransaction')
            ->once()
            ->withArgs(function ($user, $amount, $type, $description, $bookingId) use ($teacher, $booking) {
                return $user->is($teacher)
                    && abs($amount - 80.0) < 0.001
                    && $type === 'class_earnings'
                    && $description === 'أرباح حصة منتهية رقم #'.$booking->id
                    && $bookingId === $booking->id;
            })
            ->andReturn(new WalletTransaction);

        $service = new BookingService($walletServiceMock, $whiteboardServiceMock);

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
        $whiteboardServiceMock = Mockery::mock(WhiteboardService::class);
        $walletServiceMock->shouldReceive('processTransaction')
            ->once()
            ->withArgs(function ($user, $amount, $type, $description, $bookingId) use ($student, $booking) {
                return $user->is($student)
                    && abs($amount - 100.0) < 0.001
                    && $type === 'refund'
                    && str_contains($description, 'استرجاع مالي لإلغاء الحصة رقم #'.$booking->id)
                    && $bookingId === $booking->id;
            })
            ->andReturn(new WalletTransaction);

        $service = new BookingService($walletServiceMock, $whiteboardServiceMock);

        $result = $service->cancelBooking($booking, $student);

        $this->assertEquals('cancelled', $result->status);
        $this->assertEquals('available', $slot->refresh()->status);
    }

    public function test_admin_can_cancel_and_refund_abandoned_booking()
    {
        Role::firstOrCreate(['name' => 'admin']);
        $admin = User::create(['name' => 'admin', 'email' => 'admin@taj.com', 'phone' => '555', 'password' => '123']);
        $admin->assignRole('admin');

        $teacher = User::create(['name' => 'teacher', 'email' => 'teacher3@taj.com', 'phone' => '666', 'password' => '123']);
        $student = User::create(['name' => 'student', 'email' => 'student3@taj.com', 'phone' => '777', 'password' => '123']);

        $slot = TeacherSlot::create([
            'teacher_id' => $teacher->id,
            'slot_date' => now()->subDay(),
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'status' => 'available',
        ]);

        $booking = Booking::create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $slot->id,
            'booking_date' => now()->subDay(),
            'session_price' => 150.00,
            'discount_amount' => 0.00,
            'net_paid' => 150.00,
            'status' => 'abandoned',
            'agora_channel' => 'taj_test_abandoned',
        ]);

        $walletServiceMock = Mockery::mock(WalletService::class);
        $whiteboardServiceMock = Mockery::mock(WhiteboardService::class);
        $walletServiceMock->shouldReceive('processTransaction')
            ->once()
            ->withArgs(function ($user, $amount, $type, $description, $bookingId) use ($student, $booking) {
                return $user->is($student)
                    && abs($amount - 150.0) < 0.001
                    && $type === 'refund'
                    && str_contains($description, 'استرجاع مالي لإلغاء الحصة رقم #'.$booking->id)
                    && $bookingId === $booking->id;
            })
            ->andReturn(new WalletTransaction);

        $service = new BookingService($walletServiceMock, $whiteboardServiceMock);

        $result = $service->cancelBooking($booking, $admin, 'استرجاع إداري لحصة مهجورة');

        $this->assertEquals('cancelled', $result->status);
        $this->assertEquals('available', $slot->refresh()->status);
        $this->assertEquals('استرجاع إداري لحصة مهجورة', $result->refresh()->metadata['cancellation_reason']);
        $this->assertEquals($admin->id, $result->metadata['cancelled_by_id']);
    }

    public function test_non_admin_cannot_cancel_abandoned_booking()
    {
        $teacher = User::create(['name' => 'teacher', 'email' => 'teacher4@taj.com', 'phone' => '888', 'password' => '123']);
        $student = User::create(['name' => 'student', 'email' => 'student4@taj.com', 'phone' => '999', 'password' => '123']);

        $slot = TeacherSlot::create([
            'teacher_id' => $teacher->id,
            'slot_date' => now()->subDay(),
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'status' => 'available',
        ]);

        $booking = Booking::create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $slot->id,
            'booking_date' => now()->subDay(),
            'session_price' => 100.00,
            'discount_amount' => 0.00,
            'net_paid' => 100.00,
            'status' => 'abandoned',
            'agora_channel' => 'taj_test_abandoned_2',
        ]);

        $walletServiceMock = Mockery::mock(WalletService::class);
        $whiteboardServiceMock = Mockery::mock(WhiteboardService::class);
        $service = new BookingService($walletServiceMock, $whiteboardServiceMock);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('هذه الحصة معلقة لدى الإدارة ولا يمكن إلغاؤها إلا من قبل المشرف.');

        $service->cancelBooking($booking, $student);
    }

    public function test_admin_can_complete_abandoned_booking_and_disburse_earnings()
    {
        Role::firstOrCreate(['name' => 'admin']);
        $admin = User::create(['name' => 'admin', 'email' => 'admin2@taj.com', 'phone' => '101', 'password' => '123']);
        $admin->assignRole('admin');

        $teacher = User::create(['name' => 'teacher', 'email' => 'teacher5@taj.com', 'phone' => '102', 'password' => '123']);
        $student = User::create(['name' => 'student', 'email' => 'student5@taj.com', 'phone' => '103', 'password' => '123']);

        $slot = TeacherSlot::create([
            'teacher_id' => $teacher->id,
            'slot_date' => now()->subDay(),
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'status' => 'available',
        ]);

        $booking = Booking::create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $slot->id,
            'booking_date' => now()->subDay(),
            'session_price' => 200.00,
            'discount_amount' => 0.00,
            'net_paid' => 200.00,
            'status' => 'abandoned',
            'agora_channel' => 'taj_test_abandoned_3',
        ]);

        $walletServiceMock = Mockery::mock(WalletService::class);
        $whiteboardServiceMock = Mockery::mock(WhiteboardService::class);
        $walletServiceMock->shouldReceive('processTransaction')
            ->once()
            ->withArgs(function ($user, $amount, $type, $description, $bookingId) use ($teacher, $booking) {
                return $user->is($teacher)
                    && abs($amount - 160.0) < 0.001
                    && $type === 'class_earnings'
                    && str_contains($description, 'أرباح حصة منتهية رقم #'.$booking->id)
                    && $bookingId === $booking->id;
            })
            ->andReturn(new WalletTransaction);

        $service = new BookingService($walletServiceMock, $whiteboardServiceMock);

        $result = $service->completeBooking($booking, $admin, 'اعتماد بعد التأكد من الحضور');

        $this->assertEquals('completed', $result->status);
        $this->assertNotNull($result->completed_at);
        $this->assertEquals('اعتماد بعد التأكد من الحضور', $result->refresh()->metadata['admin_completion_note']);
        $this->assertEquals($admin->id, $result->metadata['completed_by_id']);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
