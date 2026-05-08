<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\GradeLevel;
use App\Models\StudentProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ParentChildTest extends TestCase
{
    use RefreshDatabase;

    protected User $parent;
    protected GradeLevel $grade;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'parent']);
        Role::firstOrCreate(['name' => 'student']);
        Role::firstOrCreate(['name' => 'teacher']);
        
        /** @var User $parent */
        $parent = User::factory()->create();
        $this->parent = $parent;
        $this->parent->assignRole('parent');
        
        $this->grade = GradeLevel::create(['name' => 'Grade 1', 'session_price' => 100.00]);
    }

    public function test_parent_can_add_child()
    {
        $payload = [
            'name' => 'Child Name',
            'email' => 'child@test.com',
            'password' => 'password123',
            'grade_level_id' => $this->grade->id,
        ];

        $response = $this->actingAs($this->parent)
                         ->postJson('/api/v1/parent/children', $payload);

        $response->assertStatus(201)
                 ->assertJson(['status' => 'success']);

        $this->assertDatabaseHas('users', [
            'name' => 'Child Name',
            'email' => 'child@test.com',
            'parent_id' => $this->parent->id
        ]);

        $child = User::where('email', 'child@test.com')->first();
        $this->assertTrue($child->hasRole('student'));
    }

    public function test_parent_can_list_their_children()
    {
        $child = User::factory()->create(['parent_id' => $this->parent->id]);
        $child->assignRole('student');
        $child->studentProfile()->create(['grade_level_id' => $this->grade->id]);

        $response = $this->actingAs($this->parent)
                         ->getJson('/api/v1/parent/children');

        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data');
    }

    public function test_parent_can_toggle_child_booking_permission()
    {
        $child = User::factory()->create(['parent_id' => $this->parent->id]);
        $profile = $child->studentProfile()->create([
            'grade_level_id' => $this->grade->id,
            'can_book_independently' => false
        ]);

        $response = $this->actingAs($this->parent)
                         ->patchJson("/api/v1/parent/children/{$child->id}/toggle-permission");

        $response->assertStatus(200);
        $this->assertTrue($profile->refresh()->can_book_independently);
    }

    public function test_parent_cannot_manage_other_parents_child()
    {
        $otherParent = User::factory()->create();
        $otherParent->assignRole('parent');
        
        $childOfOther = User::factory()->create(['parent_id' => $otherParent->id]);
        $childOfOther->studentProfile()->create(['grade_level_id' => $this->grade->id]);

        $response = $this->actingAs($this->parent)
                         ->patchJson("/api/v1/parent/children/{$childOfOther->id}/toggle-permission");

        $response->assertStatus(404);
    }

    public function test_parent_can_monitor_children_dashboard_data()
    {
        // 1. Setup: Create Child, Subject, Teacher, Slot, and Booking
        $child = User::factory()->create(['parent_id' => $this->parent->id]);
        $child->assignRole('student');
        $child->studentProfile()->create(['grade_level_id' => $this->grade->id]);
        $child->wallet()->create(['balance' => 0]);

        $subject = \App\Models\Subject::create([
            'name' => 'Math', 
            'grade_level_id' => $this->grade->id,
            'is_active' => true
        ]);

        $teacher = User::factory()->create();
        $teacher->assignRole('teacher');
        $teacher->teacherProfile()->create([
            'subject_id' => $subject->id,
            'bio' => 'Test Bio',
            'is_verified' => true,
            'hourly_rate' => 100
        ]);

        $slot = \App\Models\TeacherSlot::create([
            'teacher_id' => $teacher->id,
            'slot_date' => now()->addDay()->toDateString(),
            'start_time' => now()->addDay()->setTime(10, 0, 0),
            'end_time' => now()->addDay()->setTime(11, 0, 0),
            'is_booked' => true
        ]);

        $booking = \App\Models\Booking::create([
            'student_id' => $child->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $this->parent->id,
            'teacher_slot_id' => $slot->id,
            'booking_date' => now()->addDay(),
            'session_price' => 100,
            'net_paid' => 100,
            'agora_channel' => 'test-channel-123',
            'status' => 'completed' // Marked as completed to test review
        ]);

        // Add a review (Feedback)
        $booking->review()->create([
            'student_id' => $child->id,
            'teacher_id' => $teacher->id,
            'rating' => 5,
            'comment' => 'Excellent teacher!'
        ]);

        // 2. Act: Call the dashboard API
        $response = $this->actingAs($this->parent)
                         ->getJson('/api/v1/parent/dashboard');

        // 3. Assert: Verify the monitoring data
        $response->assertStatus(200)
                 ->assertJsonPath('data.total_spent', "100.00")
                 ->assertJsonCount(1, 'data.bookings.data')
                 ->assertJsonPath('data.bookings.data.0.student.name', $child->name)
                 ->assertJsonPath('data.bookings.data.0.teacher.name', $teacher->name)
                 ->assertJsonPath('data.bookings.data.0.review.rating', 5)
                 ->assertJsonPath('data.bookings.data.0.review.comment', 'Excellent teacher!');
    }

    public function test_json_metadata_column_is_functional()
    {
        $this->parent->update([
            'metadata' => ['theme' => 'dark', 'notifications' => true]
        ]);

        $this->assertEquals('dark', $this->parent->refresh()->metadata['theme']);
        $this->assertTrue($this->parent->metadata['notifications']);
    }
}
