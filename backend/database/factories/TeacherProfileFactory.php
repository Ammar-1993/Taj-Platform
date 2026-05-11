<?php

namespace Database\Factories;

use App\Models\Subject;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TeacherProfile>
 */
class TeacherProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'subject_id' => Subject::factory(),
            'bio' => $this->faker->paragraph(),
            'is_verified' => true,
            'average_rating' => 0.00,
            'reviews_count' => 0,
        ];
    }
}
