<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class WalletTransaction extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public const TYPE_DEPOSIT = 'deposit';

    public const TYPE_CLASS_EARNINGS = 'class_earnings';

    public const TYPE_WALLET_TOPUP = 'wallet_topup';

    public const TYPE_REFUND = 'refund';

    public const TYPE_WITHDRAWAL = 'withdrawal';

    public const TYPE_PAYOUT = 'payout';

    public const CREDIT_TYPES = [
        self::TYPE_DEPOSIT,
        self::TYPE_CLASS_EARNINGS,
        self::TYPE_WALLET_TOPUP,
        self::TYPE_REFUND,
    ];

    public const DEBIT_TYPES = [
        self::TYPE_WITHDRAWAL,
        self::TYPE_PAYOUT,
    ];

    protected static function booted(): void
    {
        static::saved(function (WalletTransaction $transaction) {
            if (Cache::supportsTags()) {
                Cache::tags(['parent_dashboard'])->flush();
            }
        });

        static::updating(function (WalletTransaction $transaction) {
            throw new \LogicException('سجلات الحركات المالية (WalletTransaction) ثابتة محاسبياً وغير قابلة للتعديل.');
        });

        static::deleting(function (WalletTransaction $transaction) {
            throw new \LogicException('سجلات الحركات المالية (WalletTransaction) ثابتة محاسبياً وغير قابلة للحذف.');
        });
    }

    public function isCredit(): bool
    {
        return in_array($this->type, self::CREDIT_TYPES, true);
    }

    public function isDebit(): bool
    {
        return in_array($this->type, self::DEBIT_TYPES, true);
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
