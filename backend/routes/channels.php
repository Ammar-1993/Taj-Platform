<?php

use App\Models\Booking;
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['auth:sanctum']]);

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('teacher.{id}', function ($user, $id) {
    return $user->hasRole('teacher') && (int) $user->id === (int) $id;
});

Broadcast::channel('classroom.{bookingId}', function ($user, $bookingId) {
    $booking = Booking::with('teacherSlot')->find($bookingId);
    if (! $booking) {
        return false;
    }

    // السماح للمشرفين بمتابعة الفصل في أي وقت
    if ($user->hasRole('admin')) {
        return true;
    }

    // السماح للمعلم أو الطالب أو ولي الأمر (الذي حجز الحصة) بالدخول
    $isParticipant = (int) $user->id === (int) $booking->teacher_id ||
           (int) $user->id === (int) $booking->student_id ||
           (int) $user->id === (int) $booking->booked_by_id;

    if (! $isParticipant) {
        return false;
    }

    // يجب أن تكون الحصة مفتوحة وضمن نافذة الدخول الزمنية
    return $booking->isClassroomOpen() && $booking->isWithinClassroomWindow();
});
