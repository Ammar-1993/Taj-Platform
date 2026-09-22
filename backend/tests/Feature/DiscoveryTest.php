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

    public function test_subjects_are_cached_and_invalidated_when_subject_changes(): void
    {
        $response1 = $this->getJson('/api/v1/discovery/subjects');
        $response1->assertStatus(200)->assertJsonCount(1, 'data');

        // Creating a new subject should trigger model booted event and invalidate cache
        $grade = GradeLevel::first();
        Subject::create([
            'grade_level_id' => $grade->id,
            'name' => 'Arabic Literature',
            'is_active' => true,
        ]);

        $response2 = $this->getJson('/api/v1/discovery/subjects');
        $response2->assertStatus(200)->assertJsonCount(2, 'data');
    }

    public function test_grade_levels_are_cached_and_invalidated_when_grade_level_changes(): void
    {
        $response1 = $this->getJson('/api/v1/discovery/grade-levels');
        $response1->assertStatus(200)->assertJsonCount(1, 'data');

        // Creating a new grade level invalidates catalog cache
        GradeLevel::create([
            'name' => 'Middle School 1',
            'session_price' => 75,
            'is_active' => true,
        ]);

        $response2 = $this->getJson('/api/v1/discovery/grade-levels');
        $response2->assertStatus(200)->assertJsonCount(2, 'data');
    }

    public function test_teacher_slots_are_cached_and_invalidated_when_slot_created_or_deleted(): void
    {
        $teacher = User::role('teacher')->first();

        $res1 = $this->getJson("/api/v1/discovery/teachers/{$teacher->id}/slots");
        $res1->assertStatus(200);
        $this->assertCount(1, array_values($res1->json('data'))[0]);

        // Add a new slot
        $tomorrow = now()->addDay()->toDateString();
        $newSlot = TeacherSlot::create([
            'teacher_id' => $teacher->id,
            'slot_date' => $tomorrow,
            'start_time' => '14:00:00',
            'end_time' => '15:00:00',
            'status' => 'available',
        ]);

        $res2 = $this->getJson("/api/v1/discovery/teachers/{$teacher->id}/slots");
        $res2->assertStatus(200);
        $this->assertCount(2, array_values($res2->json('data'))[0]);

        // Delete slot
        $newSlot->delete();

        $res3 = $this->getJson("/api/v1/discovery/teachers/{$teacher->id}/slots");
        $res3->assertStatus(200);
        $this->assertCount(1, array_values($res3->json('data'))[0]);
    }

    public function test_teachers_search_is_cached_and_invalidated_on_profile_update(): void
    {
        $teacher = User::role('teacher')->first();

        $res1 = $this->getJson('/api/v1/discovery/teachers');
        $res1->assertStatus(200)->assertJsonCount(1, 'data.data');

        // Verify unverified teacher is not included
        $teacher->teacherProfile->update(['is_verified' => false]);

        $res2 = $this->getJson('/api/v1/discovery/teachers');
        $res2->assertStatus(200)->assertJsonCount(0, 'data.data');
    }

    public function test_teacher_slots_and_discovery_slots_do_not_collide_in_cache(): void
    {
        $teacher = User::role('teacher')->first();

        // 1. Teacher views their slots in private dashboard (populates teacher schedule cache)
        $privateRes = $this->actingAs($teacher, 'sanctum')->getJson('/api/v1/teacher/slots');
        $privateRes->assertStatus(200)
            ->assertJsonStructure(['status', 'data']);

        // 2. Student or visitor views the teacher's slots via discovery (must not collide with private cache)
        $publicRes = $this->getJson("/api/v1/discovery/teachers/{$teacher->id}/slots");
        $publicRes->assertStatus(200)
            ->assertJsonStructure(['status', 'teacher_name', 'teacher', 'data']);

        $this->assertEquals($teacher->name, $publicRes->json('teacher_name'));

        // 3. Subsequence calls to both endpoints should continue to succeed
        $privateRes2 = $this->actingAs($teacher, 'sanctum')->getJson('/api/v1/teacher/slots');
        $privateRes2->assertStatus(200);

        $publicRes2 = $this->getJson("/api/v1/discovery/teachers/{$teacher->id}/slots");
        $publicRes2->assertStatus(200);
    }
}
