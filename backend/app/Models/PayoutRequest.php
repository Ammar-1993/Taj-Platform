<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property float $amount
 * @property string $bank_name
 * @property string $iban
 * @property string $status
 * @property string|null $admin_notes
 * @property Carbon|null $processed_at
 * @property string|null $notes
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class PayoutRequest extends Model
{
    protected $guarded = ['id'];

    protected $fillable = [
        'user_id',
        'amount',
        'bank_name',
        'iban',
        'status',
        'admin_notes',
        'processed_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'iban' => 'encrypted', // تشفير وفك تشفير تلقائي عبر Laravel
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
