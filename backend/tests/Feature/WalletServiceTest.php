<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WalletServiceTest extends TestCase
{
    use RefreshDatabase; // هذا التريت يقوم بمسح القاعدة بعد كل اختبار لتبقى نظيفة

    protected WalletService $walletService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->walletService = app(WalletService::class);
    }

    public function test_it_can_deposit_money_to_wallet()
    {
        // 1. تجهيز البيانات (مستخدم جديد)
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@taj.com',
            'phone' => '0500000000',
            'password' => bcrypt('password'),
        ]);

        // 2. تنفيذ العملية
        $this->walletService->processTransaction($user, 500.00, 'deposit', 'شحن اختبار');

        // 3. التحقق (النتيجة المتوقعة)
        $this->assertEquals(500.00, $user->wallet->balance);
        $this->assertDatabaseHas('wallet_transactions', [
            'type' => 'deposit',
            'amount' => 500.00,
        ]);
    }

    public function test_it_throws_exception_when_insufficient_balance()
    {
        $user = User::create([
            'name' => 'Poor User',
            'email' => 'poor@taj.com',
            'phone' => '0500000001',
            'password' => bcrypt('password'),
        ]);

        // نعطيه 50 ريال فقط
        $this->walletService->processTransaction($user, 50.00, 'deposit', 'شحن أولي');

        // نتوقع أن يرمي النظام خطأ (Exception) عند محاولة سحب 100 ريال
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('عفواً، رصيد المحفظة غير كافٍ لإتمام العملية.');

        // محاولة سحب مبلغ أكبر من الرصيد
        $this->walletService->processTransaction($user, -100.00, 'withdrawal', 'محاولة اختراق');
    }
}
