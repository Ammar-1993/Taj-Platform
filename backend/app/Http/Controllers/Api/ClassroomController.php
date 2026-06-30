<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProvisionVirtualClassroom;
use App\Models\Booking;
use App\Models\User;
use App\Services\WhiteboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Peterujah\Agora\Agora;
use Peterujah\Agora\Builders\RtcToken;
use Peterujah\Agora\Builders\RtmToken;
use Peterujah\Agora\Roles as AgoraRoles;
use Peterujah\Agora\User as AgoraUser;

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

        // تحديث حالة الحضور بشكل ذري (Atomic) لتجنب Race Conditions
        if ($user->hasRole('teacher') && ! $booking->teacher_joined_at) {
            Booking::where('id', $booking->id)
                ->whereNull('teacher_joined_at')
                ->update(['teacher_joined_at' => now(), 'status' => 'in_progress']);
        } elseif ($user->hasRole('student') && ! $booking->student_joined_at) {
            Booking::where('id', $booking->id)
                ->whereNull('student_joined_at')
                ->update(['student_joined_at' => now()]);
        }

        // تحديد الدور: المعلم والطالب هم "host" (إرسال واستقبال)، المراقبين "audience" (استقبال فقط)
        $role = ($user->id === $booking->teacher_id || $user->id === $booking->student_id) ? 'host' : 'audience';

        // 🟢 1. محاولة جلب التوكن من الكاش أولاً (Instant Access)
        $token = Cache::get("agora_token_{$booking->id}_{$user->id}");
        $rtmToken = Cache::get("agora_rtm_token_{$booking->id}_{$user->id}");
        $screenToken = ($user->id === $booking->teacher_id) ? Cache::get("agora_token_{$booking->id}_screen") : null;

        // 2. إذا لم يكن موجوداً، نقوم بتوليده فوراً
        if (!$token || !$rtmToken) {
            $context = \Sentry\Tracing\SpanContext::make()->setOp('agora')->setDescription('GenerateTokens');
            \Sentry\trace(function () use (&$token, &$rtmToken, &$screenToken, $user, $booking, $role) {
                $appId = config('services.agora.app_id');
                $appCertificate = config('services.agora.app_certificate');

                if ($appId && $appCertificate) {
                    $client = new Agora($appId, $appCertificate);
                    $client->setExpiration(now()->addHours(2)->timestamp);

                    // التوكن الأساسي (RTC و RTM)
                    $agoraUser = new AgoraUser($user->id);
                    $agoraUser->setChannel($booking->agora_channel);
                    $agoraUser->setRole($role === 'host' ? AgoraRoles::RTC_PUBLISHER : AgoraRoles::RTC_SUBSCRIBER);
                    $agoraUser->setPrivilegeExpire(now()->addHours(2)->timestamp);
                    $token = RtcToken::buildTokenWithUid($client, $agoraUser);

                    $rtmUser = new AgoraUser((string) $user->id);
                    $rtmUser->setPrivilegeExpire(now()->addHours(2)->timestamp);
                    $rtmToken = RtmToken::buildToken($client, $rtmUser);

                    // حفظه في الكاش للطلبات القادمة
                    Cache::put("agora_token_{$booking->id}_{$user->id}", $token, now()->addHours(2));
                    Cache::put("agora_rtm_token_{$booking->id}_{$user->id}", $rtmToken, now()->addHours(2));

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
            }, $context);
        }

        // 🟢 تجهيز بيانات السبورة التفاعلية
        $whiteboardRoomUuid = $booking->whiteboard_room_uuid;
        $whiteboardToken = null;

        // 🚀 Optimization: Try to provision synchronously if missing to avoid "Pending" state on first load
        if (!$whiteboardRoomUuid) {
            try {
                $roomName = "حصة: " . ($booking->student->name ?? 'طالب') . " مع " . ($booking->teacher->name ?? 'معلم');
                $whiteboardRoomUuid = $this->whiteboardService->createRoom($roomName);
                $booking->update(['whiteboard_room_uuid' => $whiteboardRoomUuid]);
                
                // Dispatch job anyway to handle token pre-generation in background
                ProvisionVirtualClassroom::dispatch($booking);
            } catch (\Exception $e) {
                Log::warning("Sync whiteboard provisioning failed, falling back to async: " . $e->getMessage());
                ProvisionVirtualClassroom::dispatch($booking);
            }
        }

        $whiteboardPayload = null;
        if ($whiteboardRoomUuid) {
            $tokenRole = ($user->id === $booking->teacher_id) ? 'admin' : 'reader';
            $cacheKey = "whiteboard_token_{$whiteboardRoomUuid}_{$tokenRole}";
            
            // ── 5.1: Non-blocking token read ────────────────────────────────────
            // Only read from cache. If it's cold, dispatch the job to fetch it
            // via the Netless API asynchronously so we don't block this response.
            $whiteboardToken = \Illuminate\Support\Facades\Cache::get($cacheKey);

            if ($whiteboardToken) {
                $whiteboardPayload = [
                    'room_uuid' => $whiteboardRoomUuid,
                    'room_token' => $whiteboardToken,
                ];
            } else {
                ProvisionVirtualClassroom::dispatch($booking);
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'channel_name' => $booking->agora_channel,
                'uid' => $user->id,
                'role' => $role,
                'token' => $token,
                'rtm_token' => $rtmToken,
                'screen_token' => $screenToken,
                'whiteboard' => $whiteboardPayload,
                'whiteboard_region' => config('services.whiteboard.region', 'sg'),
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

        // 1. Primary Token & RTM Token
        $agoraUser = new AgoraUser($user->id);
        $agoraUser->setChannel($booking->agora_channel);
        $agoraUser->setRole($role === 'host' ? AgoraRoles::RTC_PUBLISHER : AgoraRoles::RTC_SUBSCRIBER);
        $agoraUser->setPrivilegeExpire(now()->addHours(2)->timestamp);
        $token = RtcToken::buildTokenWithUid($client, $agoraUser);

        $rtmUser = new AgoraUser((string) $user->id);
        $rtmUser->setPrivilegeExpire(now()->addHours(2)->timestamp);
        $rtmToken = RtmToken::buildToken($client, $rtmUser);

        // Update Cache
        Cache::put("agora_token_{$booking->id}_{$user->id}", $token, now()->addHours(2));
        Cache::put("agora_rtm_token_{$booking->id}_{$user->id}", $rtmToken, now()->addHours(2));

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
                'rtm_token' => $rtmToken,
                'screen_token' => $screenToken
            ]
        ]);
    }

    /**
     * Force-refresh the Netless whiteboard room token for the requesting user.
     *
     * Called by the frontend Whiteboard component when the SDK fires
     * onPhaseChanged → Disconnected (token expired mid-session).
     * Bypasses the cache and mints a brand-new token from the Netless API.
     *
     * @param Request $request
     * @param int|string $bookingId
     */
    public function refreshWhiteboardToken(Request $request, $bookingId): JsonResponse
    {
        /** @var User $user */
        $user    = $request->user();
        $booking = Booking::findOrFail($bookingId);

        if (
            $booking->student_id   !== $user->id &&
            $booking->teacher_id   !== $user->id &&
            $booking->booked_by_id !== $user->id
        ) {
            return response()->json(['message' => 'غير مصرح لك'], 403);
        }

        $whiteboardRoomUuid = $booking->whiteboard_room_uuid;

        if (!$whiteboardRoomUuid) {
            return response()->json(['message' => 'غرفة السبورة غير موجودة بعد.'], 404);
        }

        try {
            $tokenRole  = ($user->id === $booking->teacher_id) ? 'admin' : 'reader';
            $durationMs = isset($booking->duration_minutes)
                ? ($booking->duration_minutes + 30) * 60 * 1000
                : 3600000;

            // Force-mint a fresh token, overwriting the cache
            $freshToken = $this->whiteboardService->refreshRoomToken($whiteboardRoomUuid, $tokenRole, $durationMs);

            \Sentry\addBreadcrumb(new \Sentry\Breadcrumb(
                \Sentry\Breadcrumb::LEVEL_INFO,
                \Sentry\Breadcrumb::TYPE_DEFAULT,
                'whiteboard',
                'whiteboard_token_refreshed',
                ['booking_id' => $bookingId, 'user_id' => $user->id, 'role' => $tokenRole]
            ));

            return response()->json([
                'status'     => 'success',
                'room_token' => $freshToken,
            ]);
        } catch (\Exception $e) {
            Log::error("refreshWhiteboardToken failed for booking #{$bookingId}: " . $e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'فشل تجديد توكن السبورة، يُرجى إعادة تحميل الصفحة.',
            ], 500);
        }
    }

    /**
     * Lightweight endpoint for polling whiteboard readiness.
     *
     * Unlike getAccessDetails, this method has zero side effects:
     * - Does NOT update attendance timestamps.
     * - Does NOT generate or check Agora tokens.
     * - Only reads whiteboard_room_uuid from the DB and generates a
     *   cached room token if the room is ready.
     *
     * Safe to call every 2–3 seconds from the frontend without causing
     * DB writes or external API calls on repeated invocations.
     *
     * @param Request $request
     * @param int|string $bookingId
     */
    public function getWhiteboardStatus(Request $request, $bookingId): JsonResponse
    {
        /** @var User $user */
        $user    = $request->user();
        $booking = Booking::findOrFail($bookingId);

        // Security: same access control as the main endpoint
        if (
            $booking->student_id  !== $user->id &&
            $booking->teacher_id  !== $user->id &&
            $booking->booked_by_id !== $user->id
        ) {
            return response()->json(['message' => 'غير مصرح لك'], 403);
        }

        $whiteboardRoomUuid = $booking->whiteboard_room_uuid;

        // Room not provisioned yet — tell the frontend to keep polling
        if (!$whiteboardRoomUuid) {
            return response()->json([
                'status' => 'pending',
                'whiteboard' => null,
            ]);
        }

        // Room exists — generate (or retrieve from cache) the room token
        try {
            $tokenRole   = ($user->id === $booking->teacher_id) ? 'admin' : 'reader';
            $durationMs  = isset($booking->duration_minutes)
                ? ($booking->duration_minutes + 30) * 60 * 1000
                : 3600000;

            $whiteboardToken = $this->whiteboardService->getRoomToken($whiteboardRoomUuid, $tokenRole, $durationMs);

            return response()->json([
                'status' => 'ready',
                'whiteboard' => [
                    'room_uuid'  => $whiteboardRoomUuid,
                    'room_token' => $whiteboardToken,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error("getWhiteboardStatus: Failed to generate token for booking #{$bookingId}: " . $e->getMessage());

            return response()->json([
                'status'     => 'error',
                'whiteboard' => null,
            ], 500);
        }
    }


}
