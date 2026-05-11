<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PromoCode extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'discount_percentage' => 'decimal:2',
            'expires_at' => 'datetime',
            'max_uses' => 'integer',
            'used_count' => 'integer',
        ];
    }

    public function isValid(): bool
    {
        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->used_count >= $this->max_uses) {
            return false;
        }

        return true;
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
