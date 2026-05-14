<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

class ClassroomController extends Controller
{
    protected WhiteboardService $whiteboardService;

    public function __construct(WhiteboardService $whiteboardService)
    {
        $this->whiteboardService = $whiteboardService;
    }

    public function getAccessDetails(Request $request, int|string $bookingId): JsonResponse
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

        // 🟢 تجهيز بيانات السبورة التفاعلية
        $whiteboardRoomUuid = $booking->whiteboard_room_uuid;
        $whiteboardToken = null;

        // Lazy creation if missing
        if (!$whiteboardRoomUuid) {
            try {
                $whiteboardRoomUuid = $this->whiteboardService->createRoom("حصة: " . ($booking->student->name ?? 'طالب') . " مع " . ($booking->teacher->name ?? 'معلم'));
                $booking->update(['whiteboard_room_uuid' => $whiteboardRoomUuid]);
            } catch (\Exception $e) {
                Log::error("Failed to lazy create whiteboard room: " . $e->getMessage());
            }
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
     * Receive a batch of drawing coordinates and broadcast them to other participants.
     *
     * @param Request $request
     * @param int $bookingId
     * @return JsonResponse
     */
    public function storeWhiteboardBatch(Request $request, int $bookingId): JsonResponse
    {
        $payload = $request->validate([
            'points' => 'required|array',
            'points.*.x' => 'required|numeric',
            'points.*.y' => 'required|numeric',
            'color' => 'required|string|size:7',
            'width' => 'required|integer|min:1|max:50',
        ]);

        try {
            $this->whiteboardService->broadcastDrawingBatch($bookingId, $payload);
            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
