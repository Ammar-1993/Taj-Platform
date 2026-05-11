<?php

namespace App\Notifications;

use App\Models\PayoutRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PayoutProcessedNotification extends Notification
{
    use Queueable;

    protected PayoutRequest $payout;

    public function __construct(PayoutRequest $payout)
    {
        $this->payout = $payout;
    }

    public function via(object $notifiable): array
    {
        return ['database']; // نحفظ الإشعار في قاعدة البيانات ليقرأه Next.js
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'payout_transferred',
            'payout_id' => $this->payout->id,
            'amount' => $this->payout->amount,
            'message' => "أخبار رائعة! تم تحويل مبلغ {$this->payout->amount} ريال إلى حسابك البنكي ({$this->payout->bank_name}). 💸",
            'time' => now()->format('Y-m-d h:i A'),
        ];
    }
}
