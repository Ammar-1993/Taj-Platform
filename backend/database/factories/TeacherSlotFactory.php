<?php

namespace Database\Factories;

use App\Models\TeacherSlot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TeacherSlot>
 */
class TeacherSlotFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = now()->hour >= 22 ? now()->setTime(14, 0) : now()->subMinutes(5);
        $end = (clone $start)->addHour();

        return [
            'teacher_id' => User::factory(),
            'slot_date' => $start->toDateString(),
            'start_time' => $start->format('H:i:s'),
            'end_time' => $end->format('H:i:s'),
            'status' => 'available',
        ];
    }

    public function future(): static
    {
        return $this->state(function (array $attributes) {
            $start = now()->addDays(2)->setTime(14, 0);
            $end = (clone $start)->addHour();

            return [
                'slot_date' => $start->toDateString(),
                'start_time' => $start->format('H:i:s'),
                'end_time' => $end->format('H:i:s'),
            ];
        });
    }
}
