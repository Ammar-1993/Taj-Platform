<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\TeacherSlot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $slot = TeacherSlot::factory()->create(['status' => 'booked']);

        return [
            'student_id' => User::factory(),
            'teacher_id' => $slot->teacher_id,
            'booked_by_id' => function (array $attributes) {
                return $attributes['student_id'];
            },
            'teacher_slot_id' => $slot->id,
            'booking_date' => $slot->slot_date,
            'session_price' => 100.00,
            'discount_amount' => 0.00,
            'net_paid' => 100.00,
            'agora_channel' => $this->faker->unique()->slug(),
            'status' => 'scheduled',
        ];
    }
}
