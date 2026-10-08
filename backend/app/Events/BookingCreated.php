<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $booking;

    /**
     * Create a new event instance.
     */
    public function __construct(Booking $booking)
    {
        $this->booking = $booking;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('teacher.'.$this->booking->teacher_id),
            new PrivateChannel('App.Models.User.'.$this->booking->student_id),
        ];

        if ($this->booking->booked_by_id && $this->booking->booked_by_id !== $this->booking->student_id) {
            $channels[] = new PrivateChannel('App.Models.User.'.$this->booking->booked_by_id);
        }

        return $channels;
    }

    /**
     * Data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'booking_id' => $this->booking->id,
            'student_name' => $this->booking->student->name,
            'message' => 'لديك حجز جديد من '.$this->booking->student->name,
        ];
    }
}
