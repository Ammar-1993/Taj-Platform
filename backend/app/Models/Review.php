<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class Review extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'rating' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saved(function (Review $review) {
            self::clearReviewCache($review->teacher_id);
        });

        static::deleted(function (Review $review) {
            self::clearReviewCache($review->teacher_id);
        });
    }

    public static function clearReviewCache(int $teacherId): void
    {
        if (Cache::supportsTags()) {
            Cache::tags(["teacher_{$teacherId}", 'reviews'])->flush();
            Cache::tags(['teachers', 'discovery'])->flush();
        }
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
