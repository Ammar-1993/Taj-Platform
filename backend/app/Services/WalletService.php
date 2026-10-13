<?php

namespace App\Services;

use App\Events\WalletUpdated;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Exception;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

class WalletService
{
    /**
     * معالجة أي عملية مالية (إيداع أو سحب) بأمان تام مع التحقق بالهللات
     */
    public function processTransaction(
        User $user,
        float $amount,
        string $type,
        string $description,
        ?int $bookingId = null,
        ?string $providerReference = null
    ): WalletTransaction {
        $newBalance = 0.00;

        $transaction = DB::transaction(function () use ($user, $amount, $type, $description, $bookingId, $providerReference, &$newBalance) {
            // lockForUpdate يمنع أي عملية أخرى من تعديل رصيد هذا المستخدم حتى تنتهي هذه العملية
            $wallet = $user->wallet()->lockForUpdate()->firstOrCreate(
                ['user_id' => $user->id],
                ['balance' => 0.00]
            );

            // احتساب الرصيد بالهللات لتجنب مشاكل دقة الفاصلة العائمة
            $currentHalalas = (int) round(((float) $wallet->balance) * 100);
            $amountHalalas = (int) round($amount * 100);
            $newHalalas = $currentHalalas + $amountHalalas;

            if ($newHalalas < 0) {
                throw new Exception('عفواً، رصيد المحفظة غير كافٍ لإتمام العملية.');
            }

            $wallet->balance = $newHalalas / 100;
            $wallet->save();
            $newBalance = (float) $wallet->balance;

            // تسجيل الحركة المالية كقيمة مطلقة (موجبة دائماً في السجل)
            return $wallet->transactions()->create([
                'booking_id' => $bookingId,
                'amount' => abs($amount),
                'type' => $type,
                'description' => $description,
                'provider_reference' => $providerReference,
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
    public function depositOnce(
        User $user,
        float $amount,
        string $description,
        string $providerReference,
        array $legacyIds = [],
        string $type = 'deposit',
        ?int $bookingId = null
    ): ?WalletTransaction {
        $newBalance = 0.00;

        try {
            $transaction = DB::transaction(function () use ($user, $amount, $description, $providerReference, $legacyIds, $type, $bookingId, &$newBalance) {
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
                        ->where('type', $type)
                        ->whereRaw("description LIKE ? ESCAPE '!'", ['%'.$escaped.'%'])
                        ->exists();

                    if ($legacyExists) {
                        return null;
                    }
                }

                // احتساب الرصيد بالهللات
                $currentHalalas = (int) round(((float) $wallet->balance) * 100);
                $amountHalalas = (int) round($amount * 100);
                $wallet->balance = ($currentHalalas + $amountHalalas) / 100;
                $wallet->save();
                $newBalance = (float) $wallet->balance;

                return $wallet->transactions()->create([
                    'booking_id' => $bookingId,
                    'amount' => abs($amount),
                    'type' => $type,
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

    /**
     * مطابقة وتدقيق رصيد المحفظة مع سجل الحركات المالية (Ledger Reconciliation)
     *
     * @return array{user_id: int, wallet_id: ?int, previous_balance: float, current_balance: float, ledger_balance: float, discrepancy: float, is_reconciled: bool, was_corrected: bool}
     */
    public function reconcileBalance(User $user, bool $autoCorrect = false): array
    {
        $wallet = $user->wallet;
        if (! $wallet) {
            return [
                'user_id' => $user->id,
                'wallet_id' => null,
                'previous_balance' => 0.00,
                'current_balance' => 0.00,
                'ledger_balance' => 0.00,
                'discrepancy' => 0.00,
                'is_reconciled' => true,
                'was_corrected' => false,
            ];
        }

        if ($autoCorrect) {
            return DB::transaction(function () use ($user, $wallet) {
                // قفل صف المحفظة المستهدفة حصراً برقمها التعريفي لمنع التضارب
                /** @var Wallet $lockedWallet */
                $lockedWallet = Wallet::whereKey($wallet->id)->lockForUpdate()->firstOrFail();

                // احتساب حركات دفتر الأستاذ من داخل المعاملة المقفلة لمنع القراءات القديمة
                $credits = (float) $lockedWallet->transactions()
                    ->whereIn('type', ['deposit', 'class_earnings', 'wallet_topup', 'refund'])
                    ->sum('amount');

                $debits = (float) $lockedWallet->transactions()
                    ->whereIn('type', ['withdrawal', 'payout'])
                    ->sum('amount');

                $ledgerBalance = round($credits - $debits, 2);
                $previousBalance = round((float) $lockedWallet->balance, 2);
                $discrepancy = round($previousBalance - $ledgerBalance, 2);
                $wasCorrected = false;

                if (abs($discrepancy) >= 0.001) {
                    $lockedWallet->balance = $ledgerBalance;
                    $lockedWallet->save();
                    $wasCorrected = true;
                }

                return [
                    'user_id' => $user->id,
                    'wallet_id' => $lockedWallet->id,
                    'previous_balance' => $previousBalance,
                    'current_balance' => $wasCorrected ? $ledgerBalance : $previousBalance,
                    'ledger_balance' => $ledgerBalance,
                    'discrepancy' => $discrepancy,
                    'is_reconciled' => true,
                    'was_corrected' => $wasCorrected,
                ];
            });
        }

        // وضع الفحص فقط (Dry-run / Inspection)
        $credits = (float) $wallet->transactions()
            ->whereIn('type', ['deposit', 'class_earnings', 'wallet_topup', 'refund'])
            ->sum('amount');

        $debits = (float) $wallet->transactions()
            ->whereIn('type', ['withdrawal', 'payout'])
            ->sum('amount');

        $ledgerBalance = round($credits - $debits, 2);
        $currentBalance = round((float) $wallet->balance, 2);
        $discrepancy = round($currentBalance - $ledgerBalance, 2);

        return [
            'user_id' => $user->id,
            'wallet_id' => $wallet->id,
            'previous_balance' => $currentBalance,
            'current_balance' => $currentBalance,
            'ledger_balance' => $ledgerBalance,
            'discrepancy' => $discrepancy,
            'is_reconciled' => abs($discrepancy) < 0.001,
            'was_corrected' => false,
        ];
    }
}
