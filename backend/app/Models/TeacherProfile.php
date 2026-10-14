<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

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
     * Get an ephemeral URL for the teacher's National ID document.
     * Uses S3 presigned temporaryUrl if supported, or falls back to a secure temporary signed route.
     */
    public function getNationalIdUrl(int $expirationMinutes = 15): ?string
    {
        return $this->generateEphemeralDocumentUrl($this->national_id_path, $expirationMinutes, 'national_id');
    }

    /**
     * Get an ephemeral URL for the teacher's Academic Degree document.
     * Uses S3 presigned temporaryUrl if supported, or falls back to a secure temporary signed route.
     */
    public function getDegreeUrl(int $expirationMinutes = 15): ?string
    {
        return $this->generateEphemeralDocumentUrl($this->degree_path, $expirationMinutes, 'degree');
    }

    /**
     * Get an ephemeral download URL for the National ID document.
     */
    public function getNationalIdDownloadUrl(int $expirationMinutes = 15): ?string
    {
        if (! $this->national_id_path) {
            return null;
        }

        if ($this->exists && Route::has('admin.teacher.kyc.document')) {
            return URL::temporarySignedRoute(
                'admin.teacher.kyc.document',
                now()->addMinutes($expirationMinutes),
                [
                    'profile' => $this->id,
                    'type' => 'national_id',
                    'download' => 1,
                ]
            );
        }

        return $this->getNationalIdUrl($expirationMinutes);
    }

    /**
     * Get an ephemeral download URL for the Academic Degree document.
     */
    public function getDegreeDownloadUrl(int $expirationMinutes = 15): ?string
    {
        if (! $this->degree_path) {
            return null;
        }

        if ($this->exists && Route::has('admin.teacher.kyc.document')) {
            return URL::temporarySignedRoute(
                'admin.teacher.kyc.document',
                now()->addMinutes($expirationMinutes),
                [
                    'profile' => $this->id,
                    'type' => 'degree',
                    'download' => 1,
                ]
            );
        }

        return $this->getDegreeUrl($expirationMinutes);
    }

    /**
     * Generate an ephemeral URL using secure temporary signed route or disk temporaryUrl fallback.
     */
    protected function generateEphemeralDocumentUrl(?string $path, int $expirationMinutes = 15, string $type = 'national_id'): ?string
    {
        if (! $path) {
            return null;
        }

        // 1. إذا كان السجل محفوظاً والمسار الإداري المشفر متاحاً، استخدم Temporary Signed Route لضمان البث الآمن من القرص المعزول
        if ($this->exists && Route::has('admin.teacher.kyc.document')) {
            return URL::temporarySignedRoute(
                'admin.teacher.kyc.document',
                now()->addMinutes($expirationMinutes),
                [
                    'profile' => $this->id,
                    'type' => $type,
                ]
            );
        }

        $diskName = config('filesystems.kyc_disk', config('filesystems.default', 'public'));
        $disk = Storage::disk($diskName);

        // 2. إذا كان القرص يدعم temporaryUrl (مثل S3 أو أقراص الاختبار الوهمية)
        try {
            return $disk->temporaryUrl(
                $path,
                now()->addMinutes($expirationMinutes)
            );
        } catch (\Throwable) {
            // 3. مسار احتياطي للبيئة المحلية والاختبارات
            if (app()->environment(['local', 'testing'])) {
                try {
                    return $disk->url($path);
                } catch (\Throwable) {
                    return null;
                }
            }

            return null;
        }
    }
}
