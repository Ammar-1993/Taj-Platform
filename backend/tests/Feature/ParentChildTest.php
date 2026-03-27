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
}
