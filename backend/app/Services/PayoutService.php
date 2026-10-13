<?php

namespace App\Services;

use App\Models\PayoutRequest;
use App\Models\User;
use App\Notifications\PayoutApprovedNotification;
use App\Notifications\PayoutProcessedNotification;
use App\Notifications\PayoutRejectedNotification;
use Exception;
use Illuminate\Support\Facades\DB;

class PayoutService
{
    protected WalletService $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    /**
     * إنشاء طلب سحب جديد وتجميد رصيد المحفظة داخل معاملة ذرية متزامنة.
     *
     * @throws Exception
     */
    public function requestPayout(User $user, float $amount, string $bankName, string $iban): PayoutRequest
    {
        if (! $user->hasRole('teacher')) {
            throw new Exception('عذراً، هذه الخدمة متاحة للمعلمين فقط.');
        }

        // احتساب المبلغ بدقة الهللات لمنع عيوب الفاصلة العائمة
        $amountHalalas = (int) round($amount * 100);
        if ($amountHalalas <= 0) {
            throw new Exception('يجب أن يكون مبلغ السحب أكبر من صفر.');
        }
        $normalizedAmount = $amountHalalas / 100;

        return DB::transaction(function () use ($user, $normalizedAmount, $bankName, $iban) {
            // قفل سجل المحفظة لمنع السحب المتزامن
            $wallet = $user->wallet()->lockForUpdate()->first();

            $balanceHalalas = $wallet ? (int) round(((float) $wallet->balance) * 100) : 0;
            $requestHalalas = (int) round($normalizedAmount * 100);

            if (! $wallet || $balanceHalalas < $requestHalalas) {
                throw new Exception('رصيدك الحالي غير كافٍ لسحب هذا المبلغ.');
            }

            // إنشاء سجل طلب السحب
            $payout = PayoutRequest::create([
                'user_id' => $user->id,
                'amount' => $normalizedAmount,
                'bank_name' => $bankName,
                'iban' => $iban,
                'status' => 'pending',
            ]);

            // تجميد الرصيد من المحفظة مع مرجع فريد
            $this->walletService->processTransaction(
                $user,
                -$normalizedAmount,
                'withdrawal',
                'تجميد رصيد لطلب سحب أرباح رقم #'.$payout->id,
                null,
                "payout_freeze:{$payout->id}"
            );

            return $payout;
        });
    }

    /**
     * اعتماد طلب السحب (موافقة مبدئية) بأمان وتحقق ذري من الحالة.
     *
     * @throws Exception
     */
    public function approvePayout(PayoutRequest|int $payout): PayoutRequest
    {
        $payoutId = $payout instanceof PayoutRequest ? $payout->id : $payout;

        return DB::transaction(function () use ($payoutId) {
            /** @var PayoutRequest $lockedPayout */
            $lockedPayout = PayoutRequest::where('id', $payoutId)->lockForUpdate()->firstOrFail();

            if ($lockedPayout->status !== 'pending') {
                throw new Exception("لا يمكن اعتماد طلب السحب في حالته الحالية ({$lockedPayout->status}). يجب أن يكون معلقاً.");
            }

            $lockedPayout->update(['status' => 'approved']);

            $lockedPayout->user->notify(new PayoutApprovedNotification($lockedPayout));

            return $lockedPayout;
        });
    }

    /**
     * رفض طلب السحب وإرجاع الرصيد بشكل ذري وغير قابل للتكرار (Idempotent Refund).
     *
     * @throws Exception
     */
    public function rejectPayout(PayoutRequest|int $payout, string $adminNotes): PayoutRequest
    {
        $payoutId = $payout instanceof PayoutRequest ? $payout->id : $payout;

        return DB::transaction(function () use ($payoutId, $adminNotes) {
            /** @var PayoutRequest $lockedPayout */
            $lockedPayout = PayoutRequest::where('id', $payoutId)->lockForUpdate()->firstOrFail();

            if ($lockedPayout->status === 'rejected') {
                throw new Exception('تم رفض هذا الطلب وإرجاع رصيده مسبقاً.');
            }

            if ($lockedPayout->status === 'transferred') {
                throw new Exception('لا يمكن رفض طلب تم تحويله بنكياً بالفعل.');
            }

            if (! in_array($lockedPayout->status, ['pending', 'approved'], true)) {
                throw new Exception("لا يمكن رفض طلب بحالته الحالية ({$lockedPayout->status}).");
            }

            $lockedPayout->update([
                'status' => 'rejected',
                'admin_notes' => $adminNotes,
            ]);

            // إرجاع الرصيد بشكل Idempotent بمرجع فريد يمنع أي تكرار نهائياً
            $refundReference = "payout_refund:{$lockedPayout->id}";
            $this->walletService->depositOnce(
                $lockedPayout->user,
                (float) $lockedPayout->amount,
                'استرجاع مبلغ طلب سحب مرفوض. السبب: '.$adminNotes,
                $refundReference,
                [],
                'refund'
            );

            $lockedPayout->user->notify(new PayoutRejectedNotification($lockedPayout, $adminNotes));

            return $lockedPayout;
        });
    }

    /**
     * تأكيد التحويل البنكي وإغلاق الطلب.
     *
     * @throws Exception
     */
    public function markAsTransferred(PayoutRequest|int $payout): PayoutRequest
    {
        $payoutId = $payout instanceof PayoutRequest ? $payout->id : $payout;

        return DB::transaction(function () use ($payoutId) {
            /** @var PayoutRequest $lockedPayout */
            $lockedPayout = PayoutRequest::where('id', $payoutId)->lockForUpdate()->firstOrFail();

            if ($lockedPayout->status === 'transferred') {
                return $lockedPayout;
            }

            if ($lockedPayout->status !== 'approved') {
                throw new Exception("لا يمكن تحويل طلب السحب في حالته الحالية ({$lockedPayout->status}). يجب أن يكون معتمداً أولاً.");
            }

            $lockedPayout->update([
                'status' => 'transferred',
            ]);

            $lockedPayout->user->notify(new PayoutProcessedNotification($lockedPayout));

            return $lockedPayout;
        });
    }
}
