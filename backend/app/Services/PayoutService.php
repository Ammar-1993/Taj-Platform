<?php

namespace App\Services;

use App\Models\PayoutRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Exception;

class PayoutService
{
    protected WalletService $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    /**
     * Create a payout request and freeze wallet balance inside an atomic transaction.
     *
     * @param User $user
     * @param float $amount
     * @param string $bankName
     * @param string $iban
     * @return PayoutRequest
     * @throws Exception
     */
    public function requestPayout(User $user, float $amount, string $bankName, string $iban): PayoutRequest
    {
        if (!$user->hasRole('teacher')) {
            throw new Exception('عذراً، هذه الخدمة متاحة للمعلمين فقط.');
        }

        return DB::transaction(function () use ($user, $amount, $bankName, $iban) {
             // 1. Lock Wallet row for this user
            $wallet = $user->wallet()->lockForUpdate()->first();

            if (!$wallet || $wallet->balance < $amount) {
                throw new Exception('رصيدك الحالي غير كافٍ لسحب هذا المبلغ.');
            }

            // 2. Create the Payout Request
            $payout = PayoutRequest::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'bank_name' => $bankName,
                'iban' => $iban, 
                'status' => 'pending'
            ]);

            // 3. Freeze Wallet Balance via WalletService
            $this->walletService->processTransaction(
                $user,
                -$amount,
                'withdrawal',
                'تجميد رصيد لطلب سحب أرباح رقم #' . $payout->id
            );

            return $payout;
        });
    }
}
