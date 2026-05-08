<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Booking;
use App\Models\SupportTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupportTicketTest extends TestCase
{
     use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_user_can_create_support_ticket()
    {
        $payload = [
            'subject' => 'مشكلة في الحجز',
            'description' => 'واجهت مشكلة أثناء محاولة دخول الحصة.',
        ];

        $response = $this->actingAs($this->user)
                         ->postJson('/api/v1/support-tickets', $payload);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                     'message' => 'تم استلام تذكرتك بنجاح، سيقوم فريق الدعم بمراجعتها والرد عليك قريباً.'
                 ]);

        $this->assertDatabaseHas('support_tickets', [
            'user_id' => $this->user->id,
            'subject' => 'مشكلة في الحجز',
            'status' => 'open'
        ]);
    }

    public function test_user_can_view_their_support_tickets()
    {
        SupportTicket::create([
            'user_id' => $this->user->id,
            'subject' => 'تذكرة 1',
            'description' => 'وصف 1',
            'status' => 'open'
        ]);

        SupportTicket::create([
            'user_id' => $this->user->id,
            'subject' => 'تذكرة 2',
            'description' => 'وصف 2',
            'status' => 'closed'
        ]);

        $response = $this->actingAs($this->user)
                         ->getJson('/api/v1/support-tickets');

        $response->assertStatus(200)
                 ->assertJsonCount(2, 'data.data')
                 ->assertJsonFragment(['subject' => 'تذكرة 1'])
                 ->assertJsonFragment(['subject' => 'تذكرة 2']);
    }

    public function test_guest_cannot_create_support_ticket()
    {
        $payload = [
            'subject' => 'Guest Subject',
            'description' => 'Guest Description',
        ];

        $response = $this->postJson('/api/v1/support-tickets', $payload);

        $response->assertStatus(401);
    }
}
