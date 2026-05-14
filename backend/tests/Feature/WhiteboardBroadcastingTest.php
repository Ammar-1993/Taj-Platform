<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\User;
use App\Events\DrawingBatchReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class WhiteboardBroadcastingTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_broadcast_drawing_batch()
    {
        Event::fake([DrawingBatchReceived::class]);

        // Seed roles for Spatie Permission
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        /** @var User $teacher */
        $teacher = User::factory()->create();
        $teacher->assignRole('teacher');
        
        $booking = Booking::factory()->create([
            'teacher_id' => $teacher->id,
            'status' => 'in_progress'
        ]);

        $payload = [
            'points' => [
                ['x' => 10, 'y' => 20],
                ['x' => 15, 'y' => 25],
            ],
            'color' => '#000000',
            'width' => 4,
        ];

        $response = $this->actingAs($teacher)
            ->postJson("/api/v1/bookings/{$booking->id}/whiteboard/batch", $payload);

        $response->assertStatus(200);
        
        Event::assertDispatched(DrawingBatchReceived::class);
    }

    public function test_rejects_invalid_whiteboard_payload()
    {
        /** @var User $teacher */
        $teacher = User::factory()->create();
        $booking = Booking::factory()->create(['teacher_id' => $teacher->id]);

        $response = $this->actingAs($teacher)
            ->postJson("/api/v1/bookings/{$booking->id}/whiteboard/batch", [
                'points' => 'not-an-array'
            ]);

        $response->assertStatus(422);
    }
}
