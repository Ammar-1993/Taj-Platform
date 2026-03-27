<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Booking;
use App\Models\TeacherProfile;
use App\Models\Subject;
use App\Models\TeacherSlot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    protected User $student;
    protected User $teacher;
    protected Booking $booking;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'student']);
        Role::firstOrCreate(['name' => 'teacher']);

        $this->student = User::factory()->create();
        $this->student->assignRole('student');

        $this->teacher = User::factory()->create();
        $this->teacher->assignRole('teacher');
        $subject = Subject::create(['name' => 'Math', 'is_active' => true]);
        $this->teacher->teacherProfile()->create([
            'subject_id' => $subject->id,
            'bio' => 'Test Bio',
            'average_rating' => 0,
            'reviews_count' => 0
        ]);

        $slot = TeacherSlot::create([
            'teacher_id' => $this->teacher->id,
            'slot_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'booked'
        ]);

        $this->booking = Booking::create([
            'student_id' => $this->student->id,
            'booked_by_id' => $this->student->id,
            'teacher_id' => $this->teacher->id,
            'teacher_slot_id' => $slot->id,
            'booking_date' => now()->toDateString(),
            'session_price' => 100.00,
            'discount_amount' => 0,
            'net_paid' => 100.00,
            'status' => 'completed',
            'agora_channel' => 'channel_' . uniqid()
        ]);
    }

    public function test_student_can_review_completed_booking()
    {
        $payload = [
            'booking_id' => $this->booking->id,
            'rating' => 5,
            'comment' => 'Great session!'
        ];

        $response = $this->actingAs($this->student)
                         ->postJson('/api/v1/reviews', $payload);

        $response->assertStatus(200)
                 ->assertJson(['status' => 'success']);

        $this->assertDatabaseHas('reviews', [
            'booking_id' => $this->booking->id,
            'rating' => 5
        ]);

        $profile = TeacherProfile::where('user_id', $this->teacher->id)->first();
        $this->assertEquals(1, $profile->reviews_count);
        $this->assertEquals(5.0, $profile->average_rating);
    }

    public function test_it_prevents_reviewing_non_completed_booking()
    {
        $this->booking->update(['status' => 'scheduled']);

        $payload = [
            'booking_id' => $this->booking->id,
            'rating' => 5,
        ];

        $response = $this->actingAs($this->student)
                         ->postJson('/api/v1/reviews', $payload);

        $response->assertStatus(400);
    }

    public function test_it_prevents_duplicate_reviews()
    {
        $this->booking->review()->create([
            'student_id' => $this->student->id,
            'teacher_id' => $this->teacher->id,
            'rating' => 4
        ]);

        $payload = [
            'booking_id' => $this->booking->id,
            'rating' => 5,
        ];

        $response = $this->actingAs($this->student)
                         ->postJson('/api/v1/reviews', $payload);

        $response->assertStatus(400);
    }
}
