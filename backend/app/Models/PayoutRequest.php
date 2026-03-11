<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayoutRequest extends Model
{
    protected $guarded = ['id'];

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