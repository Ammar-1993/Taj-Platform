<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Subject;
use App\Models\GradeLevel;
use App\Models\TeacherSlot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DiscoveryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'teacher']);
        
        $subject = Subject::create(['name' => 'Math', 'is_active' => true]);
        GradeLevel::create(['name' => 'Primary 1', 'session_price' => 50]);
        
        $teacher = User::factory()->create();
        $teacher->assignRole('teacher');
        $teacher->teacherProfile()->create([
            'subject_id' => $subject->id,
            'bio' => 'Teaching info',
            'is_verified' => true
        ]);

        TeacherSlot::create([
            'teacher_id' => $teacher->id,
            'slot_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'available'
        ]);
    }

    public function test_can_list_subjects()
    {
        $response = $this->getJson('/api/v1/discovery/subjects');
        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data');
    }

    public function test_can_list_grade_levels()
    {
        $response = $this->getJson('/api/v1/discovery/grade-levels');
        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data');
    }

    public function test_can_list_verified_teachers()
    {
        $response = $this->getJson('/api/v1/discovery/teachers');
        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data.data');
    }

    public function test_can_list_teacher_slots()
    {
        $teacherId = User::role('teacher')->first()->id;
        $response = $this->getJson("/api/v1/discovery/teachers/{$teacherId}/slots");
        
        $response->assertStatus(200)
                 ->assertJsonStructure(['data']);
    }
}
