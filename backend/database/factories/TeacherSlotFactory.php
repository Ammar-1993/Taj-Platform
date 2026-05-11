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
        $start = now()->addDay()->setTime(10, 0);
        $end = (clone $start)->addHour();

        return [
            'teacher_id' => User::factory(),
            'slot_date' => $start->toDateString(),
            'start_time' => $start->toTimeString(),
            'end_time' => $end->toTimeString(),
            'status' => 'available',
        ];
    }
}
