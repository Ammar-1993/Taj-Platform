<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;
use App\Support\BookingStatus;
use Illuminate\Http\JsonResponse;

/**
 * سياسة مركزية لدخول الفصل الافتراضي وإصدار/تجديد توكنات RTC/RTM/Whiteboard.
 *
 * كل نقاط دخول الفصل تمر من هنا حتى لا يصدر أي توكن لحجز ملغى أو مسترد أو مكتمل.
 * (فئة عادية وليست مسجلة في Gate، لتجنب أي تعارض مع اكتشاف السياسات التلقائي.)
 */
class ClassroomPolicy
{
    public const STATUS_CLOSED_MESSAGE = 'هذه الحصة لم تعد متاحة للدخول (ملغاة أو منتهية).';

    public function isTeacher(User $user, Booking $booking): bool
    {
        return (int) $user->id === (int) $booking->teacher_id;
    }

    public function isStudent(User $user, Booking $booking): bool
    {
        return (int) $user->id === (int) $booking->student_id;
    }

    public function isParticipant(User $user, Booking $booking): bool
    {
        return $this->isTeacher($user, $booking)
            || $this->isStudent($user, $booking)
            || (int) $user->id === (int) $booking->booked_by_id;
    }

    /**
     * دور Agora الصريح: المعلم والطالب publisher، ولي الأمر/الممول subscriber فقط.
     */
    public function agoraRole(User $user, Booking $booking): string
    {
        return ($this->isTeacher($user, $booking) || $this->isStudent($user, $booking))
            ? 'publisher'
            : 'subscriber';
    }

    /**
     * يعيد استجابة رفض إن لم يُسمح بالوصول، أو null إن كان الوصول مسموحاً.
     */
    public function deny(User $user, Booking $booking, string $forbiddenMessage): ?JsonResponse
    {
        if (! $this->isParticipant($user, $booking)) {
            return response()->json(['message' => $forbiddenMessage], 403);
        }

        if (! BookingStatus::isClassroomOpen($booking->status)) {
            return response()->json([
                'status' => 'error',
                'message' => self::STATUS_CLOSED_MESSAGE,
                'booking_status' => $booking->status,
            ], 409);
        }

        return null;
    }
}
