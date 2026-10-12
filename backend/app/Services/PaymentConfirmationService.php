<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * نقطة التأكيد الوحيدة لشحن المحفظة (Webhook + التحقق اليدوي).
 * تضمن مطابقة القيم المالية المؤكدة من ميسر وتنفيذ الإيداع مرة واحدة فقط (Idempotency).
 */
class PaymentConfirmationService
{
    public const CREDITED = 'credited';

    public const DUPLICATE = 'duplicate';

    public const REJECTED = 'rejected';

    public function __construct(protected WalletService $walletService) {}

    /**
     * @param  int  $amountHalalas  المبلغ المؤكد من ميسر (بالهللات)
     * @param  mixed  $metadata  metadata الفاتورة/الدفعة الأصلية المؤكدة من ميسر
     * @param  int|null  $expectedUserId  عند التحقق اليدوي: يجب أن يطابق صاحب الدفعة المستخدم الحالي
     * @return array{status: string, reason?: string, balance?: float}
     */
    public function confirmWalletTopup(
        ?string $status,
        int $amountHalalas,
        ?string $currency,
        mixed $metadata,
        ?string $paymentId,
        ?string $invoiceId,
        ?int $expectedUserId = null,
        string $source = 'webhook',
    ): array {
        if (! in_array($status, ['paid', 'completed'], true)) {
            return $this->reject('not_paid', $paymentId, $invoiceId);
        }

        if (strtoupper((string) $currency) !== 'SAR') {
            return $this->reject('currency_mismatch', $paymentId, $invoiceId);
        }

        if ($amountHalalas <= 0) {
            return $this->reject('invalid_amount', $paymentId, $invoiceId);
        }

        if (! is_array($metadata) || ($metadata['type'] ?? null) !== 'wallet_topup' || ! isset($metadata['user_id'])) {
            return $this->reject('invalid_metadata', $paymentId, $invoiceId);
        }

        $userId = (int) $metadata['user_id'];

        if ($expectedUserId !== null && $userId !== $expectedUserId) {
            return $this->reject('owner_mismatch', $paymentId, $invoiceId);
        }

        $user = User::find($userId);
        if (! $user) {
            return $this->reject('user_not_found', $paymentId, $invoiceId);
        }

        // مرجع واحد لكل فاتورة (حتى يتطابق الويب هوك مع التحقق اليدوي)، وإلا مرجع الدفعة
        if ($invoiceId) {
            $reference = 'moyasar:invoice:'.$invoiceId;
        } elseif ($paymentId) {
            $reference = 'moyasar:payment:'.$paymentId;
        } else {
            return $this->reject('missing_reference', $paymentId, $invoiceId);
        }

        $amount = $amountHalalas / 100;
        $label = $source === 'manual' ? 'شحن المحفظة عبر ميسر (تحقق يدوي)' : 'شحن المحفظة عبر ميسر';
        $description = $label.' - عملية رقم: '.($paymentId ?? $invoiceId);

        $transaction = $this->walletService->depositOnce(
            $user,
            $amount,
            $description,
            $reference,
            [$paymentId, $invoiceId],
        );

        if (! $transaction) {
            Log::info('Wallet top-up skipped (already processed)', ['reference' => $reference, 'source' => $source]);

            return ['status' => self::DUPLICATE];
        }

        Log::info('Wallet topped up', [
            'user_id' => $user->id,
            'amount' => $amount,
            'reference' => $reference,
            'source' => $source,
        ]);

        return ['status' => self::CREDITED, 'balance' => (float) $user->wallet()->value('balance')];
    }

    private function reject(string $reason, ?string $paymentId, ?string $invoiceId): array
    {
        Log::warning('Wallet top-up rejected', [
            'reason' => $reason,
            'payment_id' => $paymentId,
            'invoice_id' => $invoiceId,
        ]);

        return ['status' => self::REJECTED, 'reason' => $reason];
    }
}
