<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\SupportTicket;
use App\Models\TeacherSlot;
use App\Models\User;
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
                'message' => 'تم استلام تذكرتك بنجاح، سيقوم فريق الدعم بمراجعتها والرد عليك قريباً.',
            ]);

        $this->assertDatabaseHas('support_tickets', [
            'user_id' => $this->user->id,
            'subject' => 'مشكلة في الحجز',
            'status' => 'open',
        ]);
    }

    public function test_user_can_view_their_support_tickets()
    {
        SupportTicket::create([
            'user_id' => $this->user->id,
            'subject' => 'تذكرة 1',
            'description' => 'وصف 1',
            'status' => 'open',
        ]);

        SupportTicket::create([
            'user_id' => $this->user->id,
            'subject' => 'تذكرة 2',
            'description' => 'وصف 2',
            'status' => 'closed',
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

    public function test_user_cannot_create_ticket_with_another_users_booking(): void
    {
        $otherStudent = User::factory()->create();
        $teacher = User::factory()->create();
        $slot = TeacherSlot::create([
            'teacher_id' => $teacher->id,
            'slot_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'status' => 'booked',
        ]);

        $otherBooking = Booking::create([
            'student_id' => $otherStudent->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $otherStudent->id,
            'teacher_slot_id' => $slot->id,
            'booking_date' => now()->addDay()->toDateString(),
            'session_price' => 100,
            'net_paid' => 100,
            'status' => 'scheduled',
            'agora_channel' => 'channel_other',
        ]);

        $payload = [
            'subject' => 'شكوى عن حجز لا يخصني',
            'description' => 'محاولة ربط حجز مستخدم آخر بالتذكرة',
            'booking_id' => $otherBooking->id,
        ];

        $response = $this->actingAs($this->user)->postJson('/api/v1/support-tickets', $payload);

        $response->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'message' => 'الحجز المحدد لا يتبع لحسابك.',
            ]);
    }

    public function test_user_can_create_ticket_with_their_own_booking(): void
    {
        $teacher = User::factory()->create();
        $slot = TeacherSlot::create([
            'teacher_id' => $teacher->id,
            'slot_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'status' => 'booked',
        ]);

        $myBooking = Booking::create([
            'student_id' => $this->user->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $this->user->id,
            'teacher_slot_id' => $slot->id,
            'booking_date' => now()->addDay()->toDateString(),
            'session_price' => 100,
            'net_paid' => 100,
            'status' => 'scheduled',
            'agora_channel' => 'channel_mine',
        ]);

        $payload = [
            'subject' => 'استفسار عن حجز خاص بي',
            'description' => 'لدي استفسار عن الحصة القادمة',
            'booking_id' => $myBooking->id,
        ];

        $response = $this->actingAs($this->user)->postJson('/api/v1/support-tickets', $payload);

        $response->assertStatus(200)
            ->assertJson(['status' => 'success']);

        $this->assertDatabaseHas('support_tickets', [
            'user_id' => $this->user->id,
            'booking_id' => $myBooking->id,
        ]);
    }
}
