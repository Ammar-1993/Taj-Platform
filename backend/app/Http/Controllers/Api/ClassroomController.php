<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Peterujah\Agora\Agora;
use Peterujah\Agora\Builders\RtcToken;
use Peterujah\Agora\Roles as AgoraRoles;
use Peterujah\Agora\User as AgoraUser;

class ClassroomController extends Controller
{
    public function getAccessDetails(Request $request, $bookingId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $booking = Booking::findOrFail($bookingId);

        // حماية أمنية: هل هذا المستخدم هو المعلم أو الطالب الخاص بهذه الحصة؟
        if ($booking->student_id !== $user->id && $booking->teacher_id !== $user->id && $booking->booked_by_id !== $user->id) {
            return response()->json(['message' => 'غير مصرح لك بدخول هذه الغرفة'], 403);
        }

        // تحديث حالة الحضور
        if ($user->hasRole('teacher') && ! $booking->teacher_joined_at) {
            $booking->update(['teacher_joined_at' => now(), 'status' => 'in_progress']);
        } elseif ($user->hasRole('student') && ! $booking->student_joined_at) {
            $booking->update(['student_joined_at' => now()]);
        }

        // تحديد الدور: المعلم والطالب هم "host" (إرسال واستقبال)، المراقبين "audience" (استقبال فقط)
        $role = ($user->id === $booking->teacher_id || $user->id === $booking->student_id) ? 'host' : 'audience';

        // توليد التوكن باستخدام مكتبة Peterujah/Agora
        $appId = config('services.agora.app_id');
        $appCertificate = config('services.agora.app_certificate');

        $token = null;
        $screenToken = null;
        if ($appId && $appCertificate) {
            $client = new Agora($appId, $appCertificate);
            $client->setExpiration(now()->addHours(2)->timestamp);

            // 1. التوكن الأساسي (للكاميرا والمايكروفون)
            $agoraUser = new AgoraUser($user->id);
            $agoraUser->setChannel($booking->agora_channel);
            $agoraUser->setRole($role === 'host' ? AgoraRoles::RTC_PUBLISHER : AgoraRoles::RTC_SUBSCRIBER);
            $agoraUser->setPrivilegeExpire(now()->addHours(2)->timestamp);
            $token = RtcToken::buildTokenWithUid($client, $agoraUser);

            // 2. توكن مشاركة الشاشة (فقط للمعلم بـ UID مختلف)
            if ($user->id === $booking->teacher_id) {
                $screenAgoraUser = new AgoraUser($user->id + 1000000000);
                $screenAgoraUser->setChannel($booking->agora_channel);
                $screenAgoraUser->setRole(AgoraRoles::RTC_PUBLISHER);
                $screenAgoraUser->setPrivilegeExpire(now()->addHours(2)->timestamp);
                $screenToken = RtcToken::buildTokenWithUid($client, $screenAgoraUser);
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'channel_name' => $booking->agora_channel,
                'uid' => $user->id,
                'role' => $role,
                'token' => $token,
                'screen_token' => $screenToken,
            ],
        ]);
    }
}
