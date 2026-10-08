<?php

namespace Tests\Unit;

use App\Events\BookingCreated;
use App\Events\ClassroomJoined;
use App\Events\WalletUpdated;
use App\Models\Booking;
use App\Models\User;
use App\Models\WalletTransaction;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class BroadcastEventsTest extends TestCase
{
    #[Test]
    public function booking_created_broadcasts_on_teacher_and_student_channels(): void
    {
        $teacher = new User(['name' => 'الأستاذ أحمد']);
        $teacher->id = 10;

        $student = new User(['name' => 'الطالب عمر']);
        $student->id = 20;

        $booking = new Booking;
        $booking->id = 55;
        $booking->teacher_id = 10;
        $booking->student_id = 20;
        $booking->booked_by_id = 30; // Parent booked
        $booking->setRelation('student', $student);

        $event = new BookingCreated($booking);

        $channels = $event->broadcastOn();
        $channelNames = array_map(fn ($c) => $c->name, $channels);

        $this->assertContains('private-teacher.10', $channelNames);
        $this->assertContains('private-App.Models.User.20', $channelNames);
        $this->assertContains('private-App.Models.User.30', $channelNames);

        $payload = $event->broadcastWith();
        $this->assertEquals(55, $payload['booking_id']);
        $this->assertEquals('الطالب عمر', $payload['student_name']);
    }

    #[Test]
    public function wallet_updated_broadcasts_on_user_channel_with_balance(): void
    {
        $user = new User(['name' => 'سارة']);
        $user->id = 45;

        $transaction = new WalletTransaction([
            'id' => 101,
            'amount' => 150.00,
            'type' => 'wallet_topup',
            'description' => 'شحن محفظة عبر مدى',
        ]);

        $event = new WalletUpdated($user, 350.50, $transaction);

        $channels = $event->broadcastOn();
        $this->assertCount(1, $channels);
        $this->assertEquals('private-App.Models.User.45', $channels[0]->name);

        $payload = $event->broadcastWith();
        $this->assertEquals(45, $payload['user_id']);
        $this->assertEquals(350.50, $payload['balance']);
        $this->assertEquals(150.00, $payload['transaction']['amount']);
        $this->assertEquals('شحن محفظة عبر مدى', $payload['transaction']['description']);
    }

    #[Test]
    public function classroom_joined_broadcasts_on_classroom_channel(): void
    {
        $user = new User(['name' => 'الأستاذ خالد']);
        $user->id = 15;

        $booking = new Booking;
        $booking->id = 88;

        $event = new ClassroomJoined($booking, $user, 'teacher');

        $channels = $event->broadcastOn();
        $this->assertCount(1, $channels);
        $this->assertEquals('private-classroom.88', $channels[0]->name);

        $payload = $event->broadcastWith();
        $this->assertEquals(88, $payload['booking_id']);
        $this->assertEquals(15, $payload['user_id']);
        $this->assertEquals('الأستاذ خالد', $payload['user_name']);
        $this->assertEquals('teacher', $payload['role']);
    }
}
