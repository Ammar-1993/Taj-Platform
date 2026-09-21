<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Notifications\ClassroomProvisioningFailed;
use App\Services\AgoraService;
use App\Services\WhiteboardService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Sentry\Breadcrumb;
use Sentry\Tracing\SpanContext;

class ProvisionVirtualClassroom implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    public int $timeout = 30;

    public array $backoff = [10, 30, 60, 120, 300];

    /**
     * Create a new job instance.
     */
    public function __construct(public Booking $booking) {}

    /**
     * Execute the job.
     */
    public function handle(WhiteboardService $whiteboardService): void
    {
        $context = SpanContext::make()->setOp('job')->setDescription('ProvisionVirtualClassroom');
        \Sentry\trace(function () use ($whiteboardService) {
            // 🛡️ 1. Use a cache lock to prevent multiple joins from creating multiple rooms
            $lock = Cache::lock("provision_classroom_{$this->booking->id}", 60);

            if (! $lock->get()) {
                return;
            }

            try {
                // 2. Provision Whiteboard if missing
                if (! $this->booking->whiteboard_room_uuid) {
                    $roomName = 'حصة: '.($this->booking->student->name ?? 'طالب').' مع '.($this->booking->teacher->name ?? 'معلم');
                    $uuid = $whiteboardService->createRoom($roomName);

                    $this->booking->update(['whiteboard_room_uuid' => $uuid]);
                    Log::info("Whiteboard room created for booking #{$this->booking->id}");
                    \Sentry\addBreadcrumb(new Breadcrumb(
                        Breadcrumb::LEVEL_INFO,
                        Breadcrumb::TYPE_DEFAULT,
                        'whiteboard',
                        'whiteboard_room_provisioned',
                        ['booking_id' => $this->booking->id, 'room_uuid' => $uuid]
                    ));
                }

                // 3. 🚀 Pre-generate tokens for both participants to make entry instant
                $this->preGenerateTokens($this->booking);

                Log::info("Virtual classroom fully provisioned for booking #{$this->booking->id}");
            } catch (\Exception $e) {
                Log::error("Provisioning failed for booking #{$this->booking->id}: ".$e->getMessage());
                throw $e;
            } finally {
                $lock->release();
            }
        }, $context);
    }

    /**
     * Pre-calculate Agora and Whiteboard tokens and store them in cache.
     */
    private function preGenerateTokens(Booking $booking): void
    {
        try {
            $agoraService = app(AgoraService::class);

            // Pre-generate RTC & RTM for Teacher and Student
            foreach ([$booking->teacher_id, $booking->student_id] as $uid) {
                $agoraService->getRtcToken($booking->agora_channel, $uid, 'publisher', $booking->id);
                $agoraService->getRtmToken($uid, $booking->id);
            }

            // Pre-generate screen-sharing token for Teacher
            $agoraService->getScreenToken($booking->agora_channel, $booking->teacher_id, $booking->id);
        } catch (\Exception $e) {
            Log::warning("Failed to pre-generate Agora tokens for booking #{$booking->id}: ".$e->getMessage());
        }

        // Pre-generate Whiteboard tokens (admin for teacher, reader for student)
        if ($booking->whiteboard_room_uuid) {
            try {
                $whiteboardService = app(WhiteboardService::class);
                $whiteboardService->getRoomToken($booking->whiteboard_room_uuid, 'admin');
                $whiteboardService->getRoomToken($booking->whiteboard_room_uuid, 'reader');
            } catch (\Exception $e) {
                Log::warning("Failed to pre-generate Whiteboard tokens for booking #{$booking->id}: ".$e->getMessage());
            }
        }
    }

    /**
     * Handle a job failure.
     *
     * يُستدعى بعد استنفاد جميع محاولات الإعادة (5 محاولات بـ backoff تصاعدي).
     * يُرسل تنبيهاً فورياً بالبريد الإلكتروني لمشرفي المنصة.
     */
    public function failed(\Throwable $exception): void
    {
        Log::emergency(
            "Virtual Classroom Provisioning FAILED permanently for booking #{$this->booking->id}. Error: "
            .$exception->getMessage()
        );

        // إرسال تنبيه بريد إلكتروني للمشرفين
        $adminEmail = config('app.admin_alert_email');

        if ($adminEmail) {
            Notification::route('mail', $adminEmail)
                ->notify(new ClassroomProvisioningFailed(
                    booking: $this->booking,
                    errorMessage: $exception->getMessage(),
                ));
        } else {
            Log::critical('ADMIN_ALERT_EMAIL not configured — skipping admin notification for booking #'.$this->booking->id);
        }
    }
}
