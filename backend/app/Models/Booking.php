<?php

namespace App\Models;

use App\Support\BookingStatus;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;

/**
 * @property int $id
 * @property int $student_id
 * @property int $teacher_id
 * @property int $booked_by_id
 * @property int $teacher_slot_id
 * @property int|null $promo_code_id
 * @property bool $is_free_trial
 * @property Carbon $booking_date
 * @property float $session_price
 * @property float $discount_amount
 * @property float $net_paid
 * @property string|null $agora_channel
 * @property Carbon|null $teacher_joined_at
 * @property Carbon|null $student_joined_at
 * @property Carbon|null $completed_at
 * @property string $status
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class Booking extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = ['id'];

    protected $fillable = [
        'student_id',
        'teacher_id',
        'booked_by_id',
        'teacher_slot_id',
        'promo_code_id',
        'is_free_trial',
        'booking_date',
        'session_price',
        'discount_amount',
        'net_paid',
        'agora_channel',
        'teacher_joined_at',
        'student_joined_at',
        'completed_at',
        'status',
        'whiteboard_room_uuid',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'is_free_trial' => 'boolean',
            'booking_date' => 'date',
            'session_price' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'net_paid' => 'decimal:2',
            'teacher_joined_at' => 'datetime',
            'student_joined_at' => 'datetime',
            'completed_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::saved(function (Booking $booking) {
            self::clearBookingCaches($booking);
        });

        static::deleted(function (Booking $booking) {
            self::clearBookingCaches($booking);
        });
    }

    public static function clearBookingCaches(Booking $booking): void
    {
        if (Cache::supportsTags()) {
            $tags = ['parent_dashboard', 'bookings'];
            if ($booking->student_id) {
                $tags[] = "student_{$booking->student_id}";
            }
            if ($booking->teacher_id) {
                $tags[] = "teacher_{$booking->teacher_id}";
            }
            if ($booking->booked_by_id) {
                $tags[] = "parent_{$booking->booked_by_id}";
            }
            Cache::tags($tags)->flush();
        } else {
            $parentId = $booking->booked_by_id;
            if (! $parentId && $booking->student_id) {
                $parentId = User::where('id', $booking->student_id)->value('parent_id');
            }
            if ($parentId) {
                Cache::forget("parent_dashboard:{$parentId}:page:1");
            }
        }
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function bookedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'booked_by_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function teacherSlot(): BelongsTo
    {
        return $this->belongsTo(TeacherSlot::class);
    }

    public function promoCode(): BelongsTo
    {
        return $this->belongsTo(PromoCode::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    public function walletTransactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function sessionSummary(): HasOne
    {
        return $this->hasOne(SessionSummary::class);
    }

    public function sessionQuiz(): HasOne
    {
        return $this->hasOne(SessionQuiz::class);
    }

    /**
     * احسب وقت بداية الحصة الدقيق بالاعتماد على تاريخ ووقت الموعد (TeacherSlot).
     */
    public function getSessionStartTime(): ?Carbon
    {
        if (! $this->relationLoaded('teacherSlot')) {
            $this->load('teacherSlot');
        }

        if (! $this->teacherSlot || ! $this->teacherSlot->slot_date || ! $this->teacherSlot->start_time) {
            return null;
        }

        $dateStr = $this->teacherSlot->slot_date instanceof Carbon
            ? $this->teacherSlot->slot_date->toDateString()
            : (string) $this->teacherSlot->slot_date;
        $timeStr = (string) $this->teacherSlot->start_time;

        return Carbon::parse("{$dateStr} {$timeStr}");
    }

    /**
     * احسب وقت نهاية الحصة الدقيق.
     */
    public function getSessionEndTime(): ?Carbon
    {
        if (! $this->relationLoaded('teacherSlot')) {
            $this->load('teacherSlot');
        }

        if (! $this->teacherSlot || ! $this->teacherSlot->slot_date || ! $this->teacherSlot->end_time) {
            return null;
        }

        $dateStr = $this->teacherSlot->slot_date instanceof Carbon
            ? $this->teacherSlot->slot_date->toDateString()
            : (string) $this->teacherSlot->slot_date;
        $timeStr = (string) $this->teacherSlot->end_time;

        return Carbon::parse("{$dateStr} {$timeStr}");
    }

    /**
     * التحقق مما إذا كان الوقت الحالي يقع ضمن نافذة الدخول المسموح بها للحصة
     * (من 15 دقيقة قبل البداية وحتى نهاية وقت الحصة + ساعتين للطوارئ).
     */
    public function isWithinClassroomWindow(): bool
    {
        $startTime = $this->getSessionStartTime();
        if (! $startTime) {
            return true;
        }

        $windowStart = $startTime->copy()->subMinutes(15);
        $endTime = $this->getSessionEndTime() ?? $startTime->copy()->addHour();
        $windowEnd = $endTime->copy()->addHours(2);

        $now = now();

        return $now->greaterThanOrEqualTo($windowStart) && $now->lessThanOrEqualTo($windowEnd);
    }

    /**
     * التحقق مما إذا كانت حالة الحصة تسمح بدخول الفصل الافتراضي.
     */
    public function isClassroomOpen(): bool
    {
        return BookingStatus::isClassroomOpen($this->status);
    }
}
