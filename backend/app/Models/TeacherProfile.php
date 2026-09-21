<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class TeacherProfile extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
            'average_rating' => 'decimal:2',
            'reviews_count' => 'integer',
            'metadata' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::saved(fn () => self::clearDiscoveryCache());
        static::deleted(fn () => self::clearDiscoveryCache());
    }

    public static function clearDiscoveryCache(): void
    {
        if (Cache::supportsTags()) {
            Cache::tags(['teachers', 'discovery'])->flush();
        }
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }
}
