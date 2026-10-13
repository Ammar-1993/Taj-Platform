<?php

namespace Tests\Feature;

use App\Models\PayoutRequest;
use App\Models\User;
use App\Services\PayoutService;
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

    public function test_admin_can_approve_pending_payout(): void
    {
        $payout = PayoutRequest::create([
            'user_id' => $this->teacher->id,
            'amount' => 50,
            'bank_name' => 'Bank',
            'iban' => 'SA123',
            'status' => 'pending',
        ]);

        $payoutService = app(PayoutService::class);
        $approved = $payoutService->approvePayout($payout);

        $this->assertEquals('approved', $approved->status);
        $this->assertDatabaseHas('payout_requests', [
            'id' => $payout->id,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->teacher->id,
            'type' => 'App\Notifications\PayoutApprovedNotification',
        ]);
    }

    public function test_admin_can_mark_approved_payout_as_transferred(): void
    {
        $payout = PayoutRequest::create([
            'user_id' => $this->teacher->id,
            'amount' => 50,
            'bank_name' => 'Bank',
            'iban' => 'SA123',
            'status' => 'approved',
        ]);

        $payoutService = app(PayoutService::class);
        $transferred = $payoutService->markAsTransferred($payout);

        $this->assertEquals('transferred', $transferred->status);
        $this->assertDatabaseHas('payout_requests', [
            'id' => $payout->id,
            'status' => 'transferred',
        ]);
    }

    public function test_admin_can_reject_payout_and_refunds_teacher_wallet(): void
    {
        // 1. Initial wallet setup: deposit 100, request 50 (balance becomes 50)
        app(WalletService::class)->processTransaction($this->teacher, 100.00, 'deposit', 'Initial deposit');
        $payoutService = app(PayoutService::class);
        $payout = $payoutService->requestPayout($this->teacher, 50.00, 'Bank', 'SA1234567890123456789012');

        $this->assertEquals(50.00, $this->teacher->wallet->fresh()->balance);

        // 2. Reject payout
        $rejected = $payoutService->rejectPayout($payout, 'IBAN غير صحيح');

        $this->assertEquals('rejected', $rejected->status);
        $this->assertEquals('IBAN غير صحيح', $rejected->admin_notes);

        // 3. Balance must be restored to 100.00
        $this->assertEquals(100.00, $this->teacher->wallet->fresh()->balance);

        // 4. Refund transaction recorded with unique provider reference
        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $this->teacher->wallet->id,
            'type' => 'refund',
            'provider_reference' => "payout_refund:{$payout->id}",
        ]);

        // 5. Rejection notification created
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $this->teacher->id,
            'type' => 'App\Notifications\PayoutRejectedNotification',
        ]);
    }

    public function test_it_prevents_double_refund_on_rejected_payout(): void
    {
        app(WalletService::class)->processTransaction($this->teacher, 100.00, 'deposit', 'Initial deposit');
        $payoutService = app(PayoutService::class);
        $payout = $payoutService->requestPayout($this->teacher, 50.00, 'Bank', 'SA1234567890123456789012');

        // First rejection refunds wallet
        $payoutService->rejectPayout($payout, 'السبب الأول');
        $this->assertEquals(100.00, $this->teacher->wallet->fresh()->balance);

        // Second rejection MUST fail and not credit the wallet again
        try {
            $payoutService->rejectPayout($payout, 'السبب الثاني');
            $this->fail('Expected exception was not thrown on double rejection.');
        } catch (\Exception $e) {
            $this->assertStringContainsString('تم رفض هذا الطلب', $e->getMessage());
        }

        // Balance remains 100.00, not 150.00
        $this->assertEquals(100.00, $this->teacher->wallet->fresh()->balance);
    }

    public function test_it_prevents_rejecting_already_transferred_payout(): void
    {
        $payout = PayoutRequest::create([
            'user_id' => $this->teacher->id,
            'amount' => 50,
            'bank_name' => 'Bank',
            'iban' => 'SA123',
            'status' => 'transferred',
        ]);

        $payoutService = app(PayoutService::class);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('لا يمكن رفض طلب تم تحويله بنكياً بالفعل.');

        $payoutService->rejectPayout($payout, 'محاولة رفض متأخرة');
    }

    public function test_it_prevents_approving_non_pending_payout(): void
    {
        $payout = PayoutRequest::create([
            'user_id' => $this->teacher->id,
            'amount' => 50,
            'bank_name' => 'Bank',
            'iban' => 'SA123',
            'status' => 'rejected',
        ]);

        $payoutService = app(PayoutService::class);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('يجب أن يكون معلقاً.');

        $payoutService->approvePayout($payout);
    }

    public function test_wallet_reconciliation_detects_and_fixes_discrepancy(): void
    {
        $walletService = app(WalletService::class);

        // Create legitimate transactions: +100 deposit, -30 withdrawal => ledger = 70.00
        $walletService->processTransaction($this->teacher, 100.00, 'deposit', 'Topup');
        $walletService->processTransaction($this->teacher, -30.00, 'withdrawal', 'Lesson');

        $this->assertEquals(70.00, $this->teacher->wallet->fresh()->balance);

        // Reconciliation should show perfect match
        $check1 = $walletService->reconcileBalance($this->teacher);
        $this->assertTrue($check1['is_reconciled']);
        $this->assertEquals(0.00, $check1['discrepancy']);

        // Simulate corrupted mutable balance: e.g. balance artificially set to 999.00
        $this->teacher->wallet->update(['balance' => 999.00]);

        $check2 = $walletService->reconcileBalance($this->teacher);
        $this->assertFalse($check2['is_reconciled']);
        $this->assertEquals(929.00, $check2['discrepancy']);
        $this->assertEquals(70.00, $check2['ledger_balance']);

        // Run reconciliation with auto-correction enabled
        $check3 = $walletService->reconcileBalance($this->teacher, autoCorrect: true);
        $this->assertTrue($check3['is_reconciled']);
        $this->assertEquals(70.00, $this->teacher->wallet->fresh()->balance);

        // Verify the artisan command runs successfully
        $this->artisan('wallet:reconcile', ['--user' => $this->teacher->id])
            ->assertSuccessful();
    }

    public function test_reconciliation_isolates_wallets_and_preserves_other_users_balances(): void
    {
        $walletService = app(WalletService::class);

        $otherTeacher = User::factory()->create();
        $otherTeacher->assignRole('teacher');
        $otherWallet = $otherTeacher->wallet()->create(['balance' => 0.00]);
        $walletService->processTransaction($otherTeacher, 350.00, 'deposit', 'Other Deposit');

        // Teacher 1 has discrepancy
        $this->teacher->wallet->update(['balance' => 999.00]);

        // Auto correct teacher 1
        $walletService->reconcileBalance($this->teacher, autoCorrect: true);

        // Teacher 1 is corrected
        $this->assertEquals(0.00, $this->teacher->wallet->fresh()->balance);

        // Other teacher's wallet balance must be completely untouched
        $this->assertEquals(350.00, $otherWallet->fresh()->balance);
    }
}
