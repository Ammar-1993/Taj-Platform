<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class TeacherProfile extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    /**
     * The attributes that should be hidden for serialization.
     * Prevents raw KYC storage paths from accidental public exposure.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'national_id_path',
        'degree_path',
    ];

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

    /**
     * Get a presigned ephemeral S3/R2 URL for the teacher's National ID document.
     * Expires automatically after the given minutes (default: 5 minutes / 300 seconds).
     */
    public function getNationalIdUrl(int $expirationMinutes = 5): ?string
    {
        return $this->generateEphemeralDocumentUrl($this->national_id_path, $expirationMinutes);
    }

    /**
     * Get a presigned ephemeral S3/R2 URL for the teacher's Academic Degree document.
     * Expires automatically after the given minutes (default: 5 minutes / 300 seconds).
     */
    public function getDegreeUrl(int $expirationMinutes = 5): ?string
    {
        return $this->generateEphemeralDocumentUrl($this->degree_path, $expirationMinutes);
    }

    /**
     * Generate an ephemeral presigned URL or safely fallback to standard URL.
     */
    protected function generateEphemeralDocumentUrl(?string $path, int $expirationMinutes = 5): ?string
    {
        if (! $path) {
            return null;
        }

        $diskName = config('filesystems.default', 'public');
        $disk = Storage::disk($diskName);

        try {
            return $disk->temporaryUrl(
                $path,
                now()->addMinutes($expirationMinutes)
            );
        } catch (\Throwable) {
            return $disk->url($path);
        }
    }
}
