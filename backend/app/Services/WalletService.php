<?php

namespace App\Services;

use App\Models\User;
use App\Models\WalletTransaction;
use Exception;
use Illuminate\Support\Facades\DB;

class WalletService
{
    /**
     * معالجة أي عملية مالية (إيداع أو سحب) بأمان تام
     */
    public function processTransaction(User $user, float $amount, string $type, string $description, ?int $bookingId = null): WalletTransaction
    {
        return DB::transaction(function () use ($user, $amount, $type, $description, $bookingId) {
            // lockForUpdate يمنع أي عملية أخرى من تعديل رصيد هذا المستخدم حتى تنتهي هذه العملية
            $wallet = $user->wallet()->lockForUpdate()->firstOrCreate(
                ['user_id' => $user->id],
                ['balance' => 0.00]
            );

            $wallet->balance += $amount;

            if ($wallet->balance < 0) {
                throw new Exception('عفواً، رصيد المحفظة غير كافٍ لإتمام العملية.');
            }

            $wallet->save();

            // تسجيل الحركة المالية كقيمة مطلقة (موجبة دائماً في السجل)
            return $wallet->transactions()->create([
                'booking_id' => $bookingId,
                'amount' => abs($amount),
                'type' => $type,
                'description' => $description,
            ]);
        });
    }
}
