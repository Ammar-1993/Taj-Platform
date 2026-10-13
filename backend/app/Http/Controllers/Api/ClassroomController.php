<?php

namespace App\Http\Controllers\Api;

use App\Events\ClassroomJoined;
use App\Http\Controllers\Controller;
use App\Jobs\ProvisionVirtualClassroom;
use App\Models\Booking;
use App\Models\User;
use App\Policies\ClassroomPolicy;
use App\Services\AgoraService;
use App\Services\WhiteboardService;
use App\Support\BookingStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Sentry\Breadcrumb;

class ClassroomController extends Controller
{
    protected WhiteboardService $whiteboardService;

    protected AgoraService $agoraService;

    protected ClassroomPolicy $classroomPolicy;

    public function __construct(WhiteboardService $whiteboardService, AgoraService $agoraService, ClassroomPolicy $classroomPolicy)
    {
        $this->whiteboardService = $whiteboardService;
        $this->agoraService = $agoraService;
        $this->classroomPolicy = $classroomPolicy;
    }

    /**
     * @param  int|string  $bookingId
     */
    public function getAccessDetails(Request $request, $bookingId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $booking = Booking::findOrFail($bookingId);

        // حماية أمنية: هل هذا المستخدم طرف في الحصة؟ وهل حالة الحجز ما زالت تسمح بالدخول؟
        if ($denied = $this->classroomPolicy->deny($user, $booking, 'غير مصرح لك بدخول هذه الغرفة')) {
            return $denied;
        }

        // تحديث حالة الحضور بشكل ذري (Atomic) لتجنب Race Conditions.
        // شرط الحالة داخل الـ UPDATE يمنع إعادة فتح حجز أُلغي بالتزامن (لا انتقال خارج المسموح).
        if ($this->classroomPolicy->isTeacher($user, $booking) && ! $booking->teacher_joined_at) {
            $updated = Booking::where('id', $booking->id)
                ->whereNull('teacher_joined_at')
                ->whereIn('status', BookingStatus::CLASSROOM_OPEN)
                ->update(['teacher_joined_at' => now(), 'status' => BookingStatus::IN_PROGRESS]);
            if ($updated) {
                event(new ClassroomJoined($booking, $user, 'teacher'));
            }
        } elseif ($this->classroomPolicy->isStudent($user, $booking) && ! $booking->student_joined_at) {
            $updated = Booking::where('id', $booking->id)
                ->whereNull('student_joined_at')
                ->whereIn('status', BookingStatus::CLASSROOM_OPEN)
                ->update(['student_joined_at' => now()]);
            if ($updated) {
                event(new ClassroomJoined($booking, $user, 'student'));
            }
        }

        // تحديد الدور: المعلم والطالب هم "host" (إرسال واستقبال)، المراقبين "audience" (استقبال فقط)
        $agoraRole = $this->classroomPolicy->agoraRole($user, $booking);
        $role = ($agoraRole === 'publisher') ? 'host' : 'audience';

        // 🟢 1. جلب التوكنات بشكل ذري ومخزن مؤقتاً عبر AgoraService
        $token = $this->agoraService->getRtcToken($booking->agora_channel, $user->id, $agoraRole, $booking->id);
        $rtmToken = $this->agoraService->getRtmToken($user->id, $booking->id);
        $screenToken = $this->classroomPolicy->isTeacher($user, $booking)
            ? $this->agoraService->getScreenToken($booking->agora_channel, $user->id, $booking->id)
            : null;

        // 🟢 تجهيز بيانات السبورة التفاعلية
        $whiteboardRoomUuid = $booking->whiteboard_room_uuid;
        $whiteboardToken = null;

        // 🚀 Optimization: Try to provision synchronously if missing to avoid "Pending" state on first load
        if (! $whiteboardRoomUuid) {
            try {
                $roomName = 'حصة: '.($booking->student->name ?? 'طالب').' مع '.($booking->teacher->name ?? 'معلم');
                $whiteboardRoomUuid = $this->whiteboardService->createRoom($roomName);
                $booking->update(['whiteboard_room_uuid' => $whiteboardRoomUuid]);

                // Dispatch job anyway to handle token pre-generation in background
                ProvisionVirtualClassroom::dispatch($booking);
            } catch (\Exception $e) {
                Log::warning('Sync whiteboard provisioning failed, falling back to async: '.$e->getMessage());
                ProvisionVirtualClassroom::dispatch($booking);
            }
        }

        $whiteboardPayload = null;
        if ($whiteboardRoomUuid) {
            $tokenRole = $this->classroomPolicy->isTeacher($user, $booking) ? 'admin' : 'reader';
            $cacheKey = "whiteboard_token_{$whiteboardRoomUuid}_{$tokenRole}";

            // ── 5.1: Non-blocking token read ────────────────────────────────────
            // Only read from cache. If it's cold, dispatch the job to fetch it
            // via the Netless API asynchronously so we don't block this response.
            $whiteboardToken = Cache::get($cacheKey);

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
     * @param  int|string  $bookingId
     */
    public function refreshToken(Request $request, $bookingId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $booking = Booking::findOrFail($bookingId);

        // Security check: Same policy as getAccessDetails (participant + booking still open)
        if ($denied = $this->classroomPolicy->deny($user, $booking, 'غير مصرح لك بتجديد التوكن')) {
            return $denied;
        }

        try {
            $isTeacher = $this->classroomPolicy->isTeacher($user, $booking);
            $tokens = $this->agoraService->refreshTokens(
                $booking->agora_channel,
                $user->id,
                $isTeacher,
                $booking->id,
                $this->classroomPolicy->agoraRole($user, $booking)
            );

            return response()->json([
                'status' => 'success',
                'data' => $tokens,
            ]);
        } catch (\Exception $e) {
            Log::error("refreshToken failed for booking #{$bookingId}: ".$e->getMessage());

            return response()->json(['message' => 'فشل تجديد التوكن، يُرجى إعادة تحميل الصفحة.'], 500);
        }
    }

    /**
     * Force-refresh the Netless whiteboard room token for the requesting user.
     *
     * Called by the frontend Whiteboard component when the SDK fires
     * onPhaseChanged → Disconnected (token expired mid-session).
     * Bypasses the cache and mints a brand-new token from the Netless API.
     *
     * @param  int|string  $bookingId
     */
    public function refreshWhiteboardToken(Request $request, $bookingId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $booking = Booking::findOrFail($bookingId);

        if ($denied = $this->classroomPolicy->deny($user, $booking, 'غير مصرح لك')) {
            return $denied;
        }

        $whiteboardRoomUuid = $booking->whiteboard_room_uuid;

        if (! $whiteboardRoomUuid) {
            return response()->json(['message' => 'غرفة السبورة غير موجودة بعد.'], 404);
        }

        try {
            $tokenRole = $this->classroomPolicy->isTeacher($user, $booking) ? 'admin' : 'reader';
            $durationMs = isset($booking->duration_minutes)
                ? ($booking->duration_minutes + 30) * 60 * 1000
                : 3600000;

            // Force-mint a fresh token, overwriting the cache
            $freshToken = $this->whiteboardService->refreshRoomToken($whiteboardRoomUuid, $tokenRole, $durationMs);

            \Sentry\addBreadcrumb(new Breadcrumb(
                Breadcrumb::LEVEL_INFO,
                Breadcrumb::TYPE_DEFAULT,
                'whiteboard',
                'whiteboard_token_refreshed',
                ['booking_id' => $bookingId, 'user_id' => $user->id, 'role' => $tokenRole]
            ));

            return response()->json([
                'status' => 'success',
                'room_token' => $freshToken,
            ]);
        } catch (\Exception $e) {
            Log::error("refreshWhiteboardToken failed for booking #{$bookingId}: ".$e->getMessage());

            return response()->json([
                'status' => 'error',
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
     * @param  int|string  $bookingId
     */
    public function getWhiteboardStatus(Request $request, $bookingId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $booking = Booking::findOrFail($bookingId);

        // Security: same access policy as the main endpoint (participant + booking still open)
        if ($denied = $this->classroomPolicy->deny($user, $booking, 'غير مصرح لك')) {
            return $denied;
        }

        $whiteboardRoomUuid = $booking->whiteboard_room_uuid;

        // Room not provisioned yet — tell the frontend to keep polling
        if (! $whiteboardRoomUuid) {
            return response()->json([
                'status' => 'pending',
                'whiteboard' => null,
            ]);
        }

        // Room exists — generate (or retrieve from cache) the room token
        try {
            $tokenRole = $this->classroomPolicy->isTeacher($user, $booking) ? 'admin' : 'reader';
            $durationMs = isset($booking->duration_minutes)
                ? ($booking->duration_minutes + 30) * 60 * 1000
                : 3600000;

            $whiteboardToken = $this->whiteboardService->getRoomToken($whiteboardRoomUuid, $tokenRole, $durationMs);

            return response()->json([
                'status' => 'ready',
                'whiteboard' => [
                    'room_uuid' => $whiteboardRoomUuid,
                    'room_token' => $whiteboardToken,
                ],
                'whiteboard_region' => config('services.whiteboard.region', 'sg'),
            ]);
        } catch (\Exception $e) {
            Log::error("getWhiteboardStatus: Failed to generate token for booking #{$bookingId}: ".$e->getMessage());

            return response()->json([
                'status' => 'error',
                'whiteboard' => null,
            ], 500);
        }
    }

    /**
     * يستقبل نبضة حياة دورية من الفرونت إند أثناء الحصة (كل 30 ثانية تقريباً)
     * لتحديد ما إذا كانت الحصة لا تزال نشطة فعلياً أم مهجورة.
     */
    public function heartbeat(Request $request, $bookingId): JsonResponse
    {
        $user = $request->user();
        $booking = Booking::findOrFail($bookingId);

        if (
            $user->id !== $booking->teacher_id &&
            $user->id !== $booking->student_id &&
            $user->id !== $booking->booked_by_id
        ) {
            return response()->json(['message' => 'غير مصرح لك بالوصول لهذه الغرفة'], 403);
        }

        Booking::where('id', $bookingId)
            ->where('status', 'in_progress')
            ->update(['last_heartbeat_at' => now()]);

        return response()->json(['status' => 'ok']);
    }
}
