<?php

namespace App\Notifications;

use App\Models\PayoutRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PayoutRejectedNotification extends Notification
{
    use Queueable;

    protected PayoutRequest $payout;

    protected string $adminNotes;

    public function __construct(PayoutRequest $payout, string $adminNotes)
    {
        $this->payout = $payout;
        $this->adminNotes = $adminNotes;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'payout_rejected',
            'payout_id' => $this->payout->id,
            'amount' => $this->payout->amount,
            'admin_notes' => $this->adminNotes,
            'message' => "تم رفض طلب السحب وإرجاع المبلغ لمحفظتك. السبب: {$this->adminNotes}",
            'time' => now()->format('Y-m-d h:i A'),
        ];
    }
}
