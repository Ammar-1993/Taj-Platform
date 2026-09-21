<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class GradeLevel extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'session_price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saved(fn () => self::clearCatalogCache());
        static::deleted(fn () => self::clearCatalogCache());
    }

    public static function clearCatalogCache(): void
    {
        if (Cache::supportsTags()) {
            Cache::tags(['catalog', 'grade_levels'])->flush();
        } else {
            Cache::forget('catalog:grade_levels:active');
        }
    }

    public function studentProfiles(): HasMany
    {
        return $this->hasMany(StudentProfile::class);
    }
}
