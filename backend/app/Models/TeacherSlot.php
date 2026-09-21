<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Cache;

class TeacherSlot extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'slot_date' => 'date',
        ];
    }

    protected static function booted(): void
    {
        static::saved(function (TeacherSlot $slot) {
            self::clearSlotCache($slot->teacher_id);
        });

        static::deleted(function (TeacherSlot $slot) {
            self::clearSlotCache($slot->teacher_id);
        });
    }

    public static function clearSlotCache(int $teacherId): void
    {
        if (Cache::supportsTags()) {
            Cache::tags(["teacher_{$teacherId}", 'slots'])->flush();
            Cache::tags(['teachers', 'discovery'])->flush();
        } else {
            Cache::forget("teacher:{$teacherId}:slots:".now()->toDateString());
        }
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function booking(): HasOne
    {
        return $this->hasOne(Booking::class);
    }
}
