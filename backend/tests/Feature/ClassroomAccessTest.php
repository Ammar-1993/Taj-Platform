<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ClassroomAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthorized_user_cannot_access_classroom()
    {
        $teacher = User::factory()->create();
        $student = User::factory()->create();
        $stranger = User::factory()->create();

        $booking = Booking::factory()->create([
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'booked_by_id' => $student->id,
        ]);

        $response = $this->actingAs($stranger)->getJson("/api/v1/bookings/{$booking->id}/classroom");

        $response->assertStatus(403);
        $response->assertJson(['message' => 'غير مصرح لك بدخول هذه الغرفة']);
    }

    public function test_student_can_access_classroom_and_timestamp_updates()
    {
        $teacher = User::factory()->create();
        $student = User::factory()->create();

        $booking = Booking::factory()->create([
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'booked_by_id' => $student->id,
            'agora_channel' => 'test_channel_123',
            'student_joined_at' => null,
        ]);

        Cache::shouldReceive('get')->with("agora_token_{$booking->id}_{$student->id}")->andReturn('mocked_agora_token');
        // ClassroomController reads whiteboard token from cache too
        Cache::shouldReceive('get')->with("whiteboard_token_{$booking->whiteboard_room_uuid}_reader")->andReturn('mocked_wb_token');

        $response = $this->actingAs($student)->getJson("/api/v1/bookings/{$booking->id}/classroom");

        $response->assertStatus(200);
        $response->assertJsonPath('data.channel_name', 'test_channel_123');
        $response->assertJsonPath('data.token', 'mocked_agora_token');

        $this->assertNotNull($booking->fresh()->student_joined_at);
    }
}
