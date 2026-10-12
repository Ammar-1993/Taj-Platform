<?php

namespace App\Services;

use App\Events\WalletUpdated;
use App\Models\User;
use App\Models\WalletTransaction;
use Exception;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

class WalletService
{
    /**
     * معالجة أي عملية مالية (إيداع أو سحب) بأمان تام
     */
    public function processTransaction(User $user, float $amount, string $type, string $description, ?int $bookingId = null): WalletTransaction
    {
        $newBalance = 0.00;

        $transaction = DB::transaction(function () use ($user, $amount, $type, $description, $bookingId, &$newBalance) {
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
            $newBalance = (float) $wallet->balance;

            // تسجيل الحركة المالية كقيمة مطلقة (موجبة دائماً في السجل)
            return $wallet->transactions()->create([
                'booking_id' => $bookingId,
                'amount' => abs($amount),
                'type' => $type,
                'description' => $description,
            ]);
        });

        // بث حدث تحديث المحفظة لحظياً عبر WebSockets للمستخدم
        event(new WalletUpdated($user, $newBalance, $transaction));

        return $transaction;
    }

    /**
     * إيداع مرتبط بمرجع دفع خارجي فريد (Idempotent). يعيد null إذا سبق تنفيذ هذه الدفعة.
     *
     * @param  array<int, string>  $legacyIds  معرّفات دفع قديمة قد تكون سُجلت نصياً في الوصف قبل إضافة provider_reference
     */
    public function depositOnce(User $user, float $amount, string $description, string $providerReference, array $legacyIds = []): ?WalletTransaction
    {
        $newBalance = 0.00;

        try {
            $transaction = DB::transaction(function () use ($user, $amount, $description, $providerReference, $legacyIds, &$newBalance) {
                $wallet = $user->wallet()->lockForUpdate()->firstOrCreate(
                    ['user_id' => $user->id],
                    ['balance' => 0.00]
                );

                if (WalletTransaction::where('provider_reference', $providerReference)->exists()) {
                    return null;
                }

                foreach (array_filter($legacyIds) as $legacyId) {
                    $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $legacyId);
                    $legacyExists = WalletTransaction::where('wallet_id', $wallet->id)
                        ->where('type', 'deposit')
                        ->whereRaw("description LIKE ? ESCAPE '!'", ['%'.$escaped.'%'])
                        ->exists();

                    if ($legacyExists) {
                        return null;
                    }
                }

                $wallet->balance += $amount;
                $wallet->save();
                $newBalance = (float) $wallet->balance;

                return $wallet->transactions()->create([
                    'amount' => abs($amount),
                    'type' => 'deposit',
                    'description' => $description,
                    'provider_reference' => $providerReference,
                ]);
            });
        } catch (UniqueConstraintViolationException) {
            // سباق تزامن: عملية أخرى سجّلت نفس المرجع قبلنا (تم التراجع عن تعديل الرصيد تلقائياً)
            return null;
        }

        if ($transaction) {
            event(new WalletUpdated($user, $newBalance, $transaction));
        }

        return $transaction;
    }
}
