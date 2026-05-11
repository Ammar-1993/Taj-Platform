<?php

namespace Tests\Unit;

use App\Models\PayoutRequest;
use App\Models\User;
use App\Services\PayoutService;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PayoutServiceUnitTest extends TestCase
{
    use RefreshDatabase;

    public function test_request_payout_success_and_wallet_is_deducted()
    {
        Role::firstOrCreate(['name' => 'teacher']);
        $teacher = User::create(['name' => 'Teacher One', 'email' => 'teacher_unit@taj.com', 'phone' => '0500000002', 'password' => bcrypt('password')]);
        $teacher->assignRole('teacher');
        $teacher->wallet()->create(['balance' => 200.00]);

        $walletService = app(WalletService::class);
        $service = new PayoutService($walletService);

        $payout = $service->requestPayout($teacher, 100.00, 'Bank Unit', 'SA0000000000000000000001');

        $this->assertInstanceOf(PayoutRequest::class, $payout);
        $this->assertEquals(100.00, $payout->amount);
        $this->assertEquals('pending', $payout->status);
        $this->assertEquals(100.00, $teacher->wallet->refresh()->balance);
    }

    public function test_request_payout_fails_for_non_teacher()
    {
        $user = User::create(['name' => 'Student One', 'email' => 'student_unit@taj.com', 'phone' => '0500000003', 'password' => bcrypt('password')]);
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('عذراً، هذه الخدمة متاحة للمعلمين فقط.');

        $service = new PayoutService(app(WalletService::class));
        $service->requestPayout($user, 10.00, 'Bank Unit', 'SA0000000000000000000002');
    }

    public function test_request_payout_fails_on_insufficient_balance()
    {
        Role::firstOrCreate(['name' => 'teacher']);
        $teacher = User::create(['name' => 'Teacher Two', 'email' => 'teacher_unit2@taj.com', 'phone' => '0500000004', 'password' => bcrypt('password')]);
        $teacher->assignRole('teacher');
        $teacher->wallet()->create(['balance' => 20.00]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('رصيدك الحالي غير كافٍ لسحب هذا المبلغ.');

        $service = new PayoutService(app(WalletService::class));
        $service->requestPayout($teacher, 50.00, 'Bank Unit', 'SA0000000000000000000003');
    }
}
