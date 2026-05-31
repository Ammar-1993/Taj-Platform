<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProvisionVirtualClassroom;
use App\Models\Booking;
use App\Models\User;
use App\Services\WhiteboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Peterujah\Agora\Agora;
use Peterujah\Agora\Builders\RtcToken;
use Peterujah\Agora\Roles as AgoraRoles;
use Peterujah\Agora\User as AgoraUser;

use Illuminate\Support\Facades\Cache;

class ClassroomController extends Controller
{
    protected WhiteboardService $whiteboardService;

    public function __construct(WhiteboardService $whiteboardService)
    {
        $this->whiteboardService = $whiteboardService;
    }

    /**
     * @param Request $request
     * @param int|string $bookingId
     */
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

        // 🟢 1. محاولة جلب التوكن من الكاش أولاً (Instant Access)
        $token = Cache::get("agora_token_{$booking->id}_{$user->id}");
        $screenToken = ($user->id === $booking->teacher_id) ? Cache::get("agora_token_{$booking->id}_screen") : null;

        // 2. إذا لم يكن موجوداً، نقوم بتوليده فوراً
        if (!$token) {
            $appId = config('services.agora.app_id');
            $appCertificate = config('services.agora.app_certificate');

            if ($appId && $appCertificate) {
                $client = new Agora($appId, $appCertificate);
                $client->setExpiration(now()->addHours(2)->timestamp);

                // التوكن الأساسي
                $agoraUser = new AgoraUser($user->id);
                $agoraUser->setChannel($booking->agora_channel);
                $agoraUser->setRole($role === 'host' ? AgoraRoles::RTC_PUBLISHER : AgoraRoles::RTC_SUBSCRIBER);
                $agoraUser->setPrivilegeExpire(now()->addHours(2)->timestamp);
                $token = RtcToken::buildTokenWithUid($client, $agoraUser);

                // حفظه في الكاش للطلبات القادمة
                Cache::put("agora_token_{$booking->id}_{$user->id}", $token, now()->addHours(2));

                // توكن مشاركة الشاشة للمعلم
                if ($user->id === $booking->teacher_id) {
                    $screenAgoraUser = new AgoraUser($user->id + 1000000000);
                    $screenAgoraUser->setChannel($booking->agora_channel);
                    $screenAgoraUser->setRole(AgoraRoles::RTC_PUBLISHER);
                    $screenAgoraUser->setPrivilegeExpire(now()->addHours(2)->timestamp);
                    $screenToken = RtcToken::buildTokenWithUid($client, $screenAgoraUser);
                    Cache::put("agora_token_{$booking->id}_screen", $screenToken, now()->addHours(2));
                }
            }
        }

        // 🟢 تجهيز بيانات السبورة التفاعلية
        $whiteboardRoomUuid = $booking->whiteboard_room_uuid;
        $whiteboardToken = null;

        // If missing, trigger async provisioning but don't block the RTC flow
        if (!$whiteboardRoomUuid) {
            ProvisionVirtualClassroom::dispatch($booking);
        }

        if ($whiteboardRoomUuid) {
            try {
                // Teacher gets full admin token; everyone else gets a lightweight read-only token.
                $tokenRole = ($user->id === $booking->teacher_id) ? 'admin' : 'reader';

                // Align token lifespan with the actual booking duration (+30 min buffer).
                $durationMs = isset($booking->duration_minutes)
                    ? ($booking->duration_minutes + 30) * 60 * 1000
                    : 3600000; // fallback: 1 hour

                $whiteboardToken = $this->whiteboardService->getRoomToken($whiteboardRoomUuid, $tokenRole, $durationMs);
            } catch (\Exception $e) {
                Log::error("Failed to generate whiteboard token: " . $e->getMessage());
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
                'whiteboard' => [
                    'room_uuid' => $whiteboardRoomUuid,
                    'room_token' => $whiteboardToken,
                ],
            ],
        ]);
    }

    /**
     * @param Request $request
     * @param int|string $bookingId
     */
    public function refreshToken(Request $request, $bookingId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $booking = Booking::findOrFail($bookingId);

        // Security check: Same as getAccessDetails
        if ($booking->student_id !== $user->id && $booking->teacher_id !== $user->id && $booking->booked_by_id !== $user->id) {
            return response()->json(['message' => 'غير مصرح لك بتجديد التوكن'], 403);
        }

        $role = ($user->id === $booking->teacher_id || $user->id === $booking->student_id) ? 'host' : 'audience';

        $appId = config('services.agora.app_id');
        $appCertificate = config('services.agora.app_certificate');

        if (!$appId || !$appCertificate) {
            return response()->json(['message' => 'Agora configuration missing'], 500);
        }

        $client = new Agora($appId, $appCertificate);
        $client->setExpiration(now()->addHours(2)->timestamp);

        // 1. Primary Token
        $agoraUser = new AgoraUser($user->id);
        $agoraUser->setChannel($booking->agora_channel);
        $agoraUser->setRole($role === 'host' ? AgoraRoles::RTC_PUBLISHER : AgoraRoles::RTC_SUBSCRIBER);
        $agoraUser->setPrivilegeExpire(now()->addHours(2)->timestamp);
        $token = RtcToken::buildTokenWithUid($client, $agoraUser);

        // Update Cache
        Cache::put("agora_token_{$booking->id}_{$user->id}", $token, now()->addHours(2));

        // 2. Screen Token (Only for Teacher)
        $screenToken = null;
        if ($user->id === $booking->teacher_id) {
            $screenAgoraUser = new AgoraUser($user->id + 1000000000);
            $screenAgoraUser->setChannel($booking->agora_channel);
            $screenAgoraUser->setRole(AgoraRoles::RTC_PUBLISHER);
            $screenAgoraUser->setPrivilegeExpire(now()->addHours(2)->timestamp);
            $screenToken = RtcToken::buildTokenWithUid($client, $screenAgoraUser);
            Cache::put("agora_token_{$booking->id}_screen", $screenToken, now()->addHours(2));
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'token' => $token,
                'screen_token' => $screenToken
            ]
        ]);
    }
}
