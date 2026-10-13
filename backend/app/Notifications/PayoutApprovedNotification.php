<?php

namespace App\Notifications;

use App\Models\PayoutRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PayoutApprovedNotification extends Notification
{
    use Queueable;

    protected PayoutRequest $payout;

    public function __construct(PayoutRequest $payout)
    {
        $this->payout = $payout;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'payout_approved',
            'payout_id' => $this->payout->id,
            'amount' => $this->payout->amount,
            'message' => "تم اعتماد طلب السحب بمبلغ {$this->payout->amount} ريال وسوف يتم تحويله قريباً.",
            'time' => now()->format('Y-m-d h:i A'),
        ];
    }
}
