<?php

namespace App\Support;

/**
 * مصدر الحقيقة الوحيد لحالات الحجز وانتقالاتها المسموح بها.
 *
 * القيم مطابقة تماماً لعمود ENUM في جدول bookings، لذلك لا يلزم أي migration.
 * أي تغيير لحالة الحجز يجب أن يمر عبر canTransition() داخل معاملة مقفلة.
 */
final class BookingStatus
{
    public const PENDING_PAYMENT = 'pending_payment';

    public const SCHEDULED = 'scheduled';

    public const IN_PROGRESS = 'in_progress';

    public const COMPLETED = 'completed';

    public const CANCELLED = 'cancelled';

    public const REFUNDED = 'refunded';

    public const ABANDONED = 'abandoned';

    /** الحالات التي يُسمح فيها بدخول الفصل الافتراضي وإصدار/تجديد التوكنات */
    public const CLASSROOM_OPEN = [self::SCHEDULED, self::IN_PROGRESS];

    /** الحالات النهائية: لا يخرج منها الحجز أبداً */
    public const TERMINAL = [self::COMPLETED, self::CANCELLED, self::REFUNDED];

    /**
     * خريطة الانتقالات المسموح بها (from => [to, ...]).
     *
     * ملاحظة: الانتقال abandoned → completed (اعتماد الحصة المهجورة) مسموح هنا
     * لكنه مقصور على المشرف، ويُفرض ذلك في BookingService.
     */
    private const TRANSITIONS = [
        self::PENDING_PAYMENT => [self::SCHEDULED, self::CANCELLED],
        self::SCHEDULED => [self::IN_PROGRESS, self::CANCELLED],
        self::IN_PROGRESS => [self::COMPLETED, self::CANCELLED, self::ABANDONED],
        self::ABANDONED => [self::COMPLETED, self::CANCELLED],
    ];

    public static function canTransition(?string $from, string $to): bool
    {
        return in_array($to, self::TRANSITIONS[$from] ?? [], true);
    }

    public static function isClassroomOpen(?string $status): bool
    {
        return in_array($status, self::CLASSROOM_OPEN, true);
    }
}
