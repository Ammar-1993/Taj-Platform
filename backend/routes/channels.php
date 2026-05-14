<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('teacher.{id}', function ($user, $id) {
    return $user->hasRole('teacher') && (int) $user->id === (int) $id;
});

Broadcast::channel('classroom.{bookingId}', function ($user, $bookingId) {
    $booking = \App\Models\Booking::find($bookingId);
    if (!$booking) {
        return false;
    }

    // السماح للمعلم أو الطالب أو ولي الأمر (الذي حجز الحصة) بالدخول
    return (int) $user->id === (int) $booking->teacher_id ||
           (int) $user->id === (int) $booking->student_id ||
           (int) $user->id === (int) $booking->booked_by_id;
});
