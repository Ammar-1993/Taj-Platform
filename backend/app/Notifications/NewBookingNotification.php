<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewBookingNotification extends Notification
{
    use Queueable;

    protected Booking $booking;

    public function __construct(Booking $booking)
    {
        $this->booking = $booking;
    }

    public function via(object $notifiable): array
    {
        return ['database']; // سنحفظ الإشعار في الداتابيز فقط حالياً
    }

    public function toArray(object $notifiable): array
    {
        return [
            'booking_id' => $this->booking->id,
            'student_name' => $this->booking->student->name,
            'booking_date' => \Carbon\Carbon::parse($this->booking->booking_date)->format('Y-m-d'),
            'time' => substr($this->booking->teacherSlot->start_time, 0, 5),
            'message' => "حجز جديد! قام الطالب {$this->booking->student->name} بحجز حصة معك."
        ];
    }
}