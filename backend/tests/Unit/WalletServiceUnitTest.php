<?php

namespace Tests\Unit;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Services\WalletService;

class WalletServiceUnitTest extends TestCase
{
    use RefreshDatabase;

    protected WalletService $walletService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->walletService = app(WalletService::class);
    }

    public function test_process_transaction_deposit_and_withdrawal_success()
    {
        $user = User::create([ 'name' => 'Test User', 'email' => 'unit@taj.com', 'phone' => '0500000000', 'password' => bcrypt('password') ]);

        $this->walletService->processTransaction($user, 100.00, 'deposit', 'Unit deposit');
        $this->assertEquals(100.00, $user->wallet->refresh()->balance);

        $this->walletService->processTransaction($user, -50.00, 'withdrawal', 'Unit withdrawal');
        $this->assertEquals(50.00, $user->wallet->refresh()->balance);
    }

    public function test_process_transaction_raises_on_insufficient_balance()
    {
        $user = User::create([ 'name' => 'Poor User', 'email' => 'unitpoor@taj.com', 'phone' => '0500000001', 'password' => bcrypt('password') ]);

        $this->walletService->processTransaction($user, 20.00, 'deposit', 'Small startup');

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('عفواً، رصيد المحفظة غير كافٍ لإتمام العملية.');

        try {
            $this->walletService->processTransaction($user, -30.00, 'withdrawal', 'Overdraw');
        } finally {
            $wallet = $user->wallet;
            $this->assertDatabaseMissing('wallet_transactions', [
                'wallet_id' => $wallet->id,
                'type' => 'withdrawal',
                'amount' => 30.00,
            ]);
            $this->assertEquals(20.00, $wallet->refresh()->balance);
        }
    }
}
