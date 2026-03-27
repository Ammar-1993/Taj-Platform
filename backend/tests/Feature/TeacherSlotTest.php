<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\TeacherSlot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TeacherSlotTest extends TestCase
{
    use RefreshDatabase;

    protected User $teacher;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'teacher']);
        /** @var User $teacher */
        $teacher = User::factory()->create();
        $this->teacher = $teacher;
        $this->teacher->assignRole('teacher');
    }

    public function test_teacher_can_list_their_slots()
    {
        TeacherSlot::create([
            'teacher_id' => $this->teacher->id,
            'slot_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'available'
        ]);

        $response = $this->actingAs($this->teacher)
                         ->getJson('/api/v1/teacher/slots');

        $response->assertStatus(200)
                 ->assertJsonStructure(['status', 'data']);
    }

    public function test_teacher_can_create_a_new_slot()
    {
        $payload = [
            'slot_date' => now()->addDay()->toDateString(),
            'start_time' => '14:00',
            'end_time' => '15:00',
        ];

        $response = $this->actingAs($this->teacher)
                         ->postJson('/api/v1/teacher/slots', $payload);

        $response->assertStatus(201)
                 ->assertJson([
                     'status' => 'success',
                     'message' => 'تم إضافة الموعد بنجاح!'
                 ]);

        $this->assertDatabaseHas('teacher_slots', [
            'teacher_id' => $this->teacher->id,
            'slot_date' => $payload['slot_date'],
            'start_time' => '14:00:00',
        ]);
    }

    public function test_it_prevents_overlapping_slots_for_same_teacher()
    {
        TeacherSlot::create([
            'teacher_id' => $this->teacher->id,
            'slot_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'available'
        ]);

        $payload = [
            'slot_date' => now()->addDay()->toDateString(),
            'start_time' => '10:30', // Overlaps!
            'end_time' => '11:30',
        ];

        $response = $this->actingAs($this->teacher)
                         ->postJson('/api/v1/teacher/slots', $payload);

        $response->assertStatus(422)
                 ->assertJson([
                     'status' => 'error',
                 ]);
    }

    public function test_teacher_can_delete_available_slot()
    {
        $slot = TeacherSlot::create([
            'teacher_id' => $this->teacher->id,
            'slot_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'available'
        ]);

        $response = $this->actingAs($this->teacher)
                         ->deleteJson("/api/v1/teacher/slots/{$slot->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('teacher_slots', ['id' => $slot->id]);
    }

    public function test_it_prevents_deleting_booked_slot()
    {
        $slot = TeacherSlot::create([
            'teacher_id' => $this->teacher->id,
            'slot_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'booked'
        ]);

        $response = $this->actingAs($this->teacher)
                         ->deleteJson("/api/v1/teacher/slots/{$slot->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('teacher_slots', ['id' => $slot->id]);
    }
}
