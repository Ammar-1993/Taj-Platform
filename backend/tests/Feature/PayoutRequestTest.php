<?php

namespace Tests\Feature;

use App\Models\PayoutRequest;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PayoutRequestTest extends TestCase
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
        $this->teacher->wallet()->create(['balance' => 0.00]);
    }

    public function test_teacher_can_request_payout()
    {
        // Add balance to teacher's wallet
        app(WalletService::class)->processTransaction($this->teacher, 100.00, 'deposit', 'Earnings');

        $payload = [
            'amount' => 50,
            'bank_name' => 'Test Bank',
            'iban' => 'SA1234567890123456789012',
        ];

        $response = $this->actingAs($this->teacher)
            ->postJson('/api/v1/wallet/payouts', $payload);

        $response->assertStatus(201)
            ->assertJson(['status' => 'success']);

        $this->assertDatabaseHas('payout_requests', [
            'user_id' => $this->teacher->id,
            'amount' => 50,
            'status' => 'pending',
        ]);

        // Balance should be frozen (deducted)
        $this->assertEquals(50.00, $this->teacher->wallet->refresh()->balance);
    }

    public function test_it_prevents_payout_with_insufficient_balance()
    {
        $payload = [
            'amount' => 50,
            'bank_name' => 'Test Bank',
            'iban' => 'SA1234567890123456789012',
        ];

        $response = $this->actingAs($this->teacher)
            ->postJson('/api/v1/wallet/payouts', $payload);

        $response->assertStatus(400)
            ->assertJsonStructure(['message']);
    }

    public function test_teacher_can_list_their_payout_requests()
    {
        PayoutRequest::create([
            'user_id' => $this->teacher->id,
            'amount' => 50,
            'bank_name' => 'Bank',
            'iban' => 'SA123',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->teacher)
            ->getJson('/api/v1/wallet/payouts');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }
}
