<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassroomController extends Controller
{
    public function getAccessDetails(Request $request, $bookingId): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $booking = Booking::findOrFail($bookingId);

        // حماية أمنية: هل هذا المستخدم هو المعلم أو الطالب الخاص بهذه الحصة؟
        if ($booking->student_id !== $user->id && $booking->teacher_id !== $user->id && $booking->booked_by_id !== $user->id) {
            return response()->json(['message' => 'غير مصرح لك بدخول هذه الغرفة'], 403);
        }

        // تحديث حالة الحضور
        if ($user->hasRole('teacher') && !$booking->teacher_joined_at) {
            $booking->update(['teacher_joined_at' => now(), 'status' => 'in_progress']);
        } elseif ($user->hasRole('student') && !$booking->student_joined_at) {
            $booking->update(['student_joined_at' => now()]);
        }

        // في الإنتاج: هنا نستخدم RtcTokenBuilder2 لتوليد التوكن باستخدام APP_ID و APP_CERTIFICATE
        // التعديل: سنعطي دور 'host' لكل من المعلم والطالب لتمكين التواصل الثنائي (صوت وصورة)
        // أما المراقبين (مثل ولي الأمر) فسيبقون بـ دور 'audience'
        $role = ($user->id === $booking->teacher_id || $user->id === $booking->student_id) ? 'host' : 'audience';

        return response()->json([
            'status' => 'success',
            'data' => [
                'channel_name' => $booking->agora_channel,
                'uid' => $user->id,
                'role' => $role,
            ]
        ]);
    }
}