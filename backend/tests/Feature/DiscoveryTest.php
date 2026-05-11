<?php

namespace Tests\Feature;

use App\Models\GradeLevel;
use App\Models\Subject;
use App\Models\TeacherSlot;
use App\Models\User;
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

        $grade = GradeLevel::create(['name' => 'Primary 1', 'session_price' => 50]);
        $subject = Subject::create([
            'grade_level_id' => $grade->id,
            'name' => 'Math',
            'is_active' => true,
        ]);

        $teacher = User::factory()->create();
        $teacher->assignRole('teacher');
        $teacher->teacherProfile()->create([
            'subject_id' => $subject->id,
            'bio' => 'Teaching info',
            'is_verified' => true,
        ]);

        TeacherSlot::create([
            'teacher_id' => $teacher->id,
            'slot_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'status' => 'available',
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

    public function test_student_only_sees_teachers_from_their_grade_level()
    {
        Role::firstOrCreate(['name' => 'student']);

        $otherGrade = GradeLevel::create(['name' => 'Secondary', 'session_price' => 100]);
        $otherSubject = Subject::create([
            'grade_level_id' => $otherGrade->id,
            'name' => 'Physics',
            'is_active' => true,
        ]);

        $otherTeacher = User::factory()->create();
        $otherTeacher->assignRole('teacher');
        $otherTeacher->teacherProfile()->create([
            'subject_id' => $otherSubject->id,
            'bio' => 'Physics info',
            'is_verified' => true,
        ]);

        /** @var User $student */
        $student = User::factory()->create();
        $student->assignRole('student');
        $student->studentProfile()->create([
            'grade_level_id' => GradeLevel::where('name', 'Primary 1')->first()->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($student, 'sanctum')->getJson('/api/v1/discovery/teachers');

        // Should only see the Primary 1 teacher, not the Secondary teacher
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data');

        $this->assertEquals(
            Subject::where('name', 'Math')->first()->id,
            $response->json('data.data.0.teacher_profile.subject_id')
        );

        // Guest should see both teachers
        auth()->forgetGuards(); // Clear authenticated users from all guards
        $guestResponse = $this->getJson('/api/v1/discovery/teachers');
        $guestResponse->assertStatus(200)
            ->assertJsonCount(2, 'data.data');
    }
}
