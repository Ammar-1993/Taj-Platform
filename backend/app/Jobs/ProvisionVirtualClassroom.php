<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Services\WhiteboardService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

use Peterujah\Agora\Agora;
use Peterujah\Agora\Builders\RtcToken;
use Peterujah\Agora\Roles as AgoraRoles;
use Peterujah\Agora\User as AgoraUser;
use Illuminate\Support\Facades\Cache;

class ProvisionVirtualClassroom implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;
    public int $timeout = 30;
    public array $backoff = [10, 30, 60, 120, 300];

    /**
     * Create a new job instance.
     */
    public function __construct(public Booking $booking)
    {
    }

    /**
     * Execute the job.
     */
    public function handle(WhiteboardService $whiteboardService): void
    {
        // 🛡️ 1. Use a cache lock to prevent multiple joins from creating multiple rooms
        $lock = Cache::lock("provision_classroom_{$this->booking->id}", 60);

        if (!$lock->get()) {
            return;
        }

        try {
            // 2. Provision Whiteboard if missing
            if (!$this->booking->whiteboard_room_uuid) {
                $roomName = "حصة: " . ($this->booking->student->name ?? 'طالب') . " مع " . ($this->booking->teacher->name ?? 'معلم');
                $uuid = $whiteboardService->createRoom($roomName);
                
                $this->booking->update(['whiteboard_room_uuid' => $uuid]);
                Log::info("Whiteboard room created for booking #{$this->booking->id}");
            }

            // 3. 🚀 Pre-generate tokens for both participants to make entry instant
            $this->preGenerateTokens($this->booking);

            Log::info("Virtual classroom fully provisioned for booking #{$this->booking->id}");
        } catch (\Exception $e) {
            Log::error("Provisioning failed for booking #{$this->booking->id}: " . $e->getMessage());
            throw $e;
        } finally {
            $lock->release();
        }
    }

    /**
     * Pre-calculate Agora and Whiteboard tokens and store them in cache.
     */
    private function preGenerateTokens(Booking $booking): void
    {
        $appId = config('services.agora.app_id');
        $appCertificate = config('services.agora.app_certificate');

        if (!$appId || !$appCertificate) return;

        $client = new Agora($appId, $appCertificate);
        $client->setExpiration(now()->addHours(2)->timestamp);

        // Generate for Teacher and Student
        $participants = [
            ['id' => $booking->teacher_id, 'role' => 'host'],
            ['id' => $booking->student_id, 'role' => 'host'],
        ];

        foreach ($participants as $p) {
            $agoraUser = new AgoraUser($p['id']);
            $agoraUser->setChannel($booking->agora_channel);
            $agoraUser->setRole(AgoraRoles::RTC_PUBLISHER);
            $agoraUser->setPrivilegeExpire(now()->addHours(2)->timestamp);
            
            $token = RtcToken::buildTokenWithUid($client, $agoraUser);
            
            // Cache the Agora Token for 2 hours
            Cache::put("agora_token_{$booking->id}_{$p['id']}", $token, now()->addHours(2));
        }

        // Pre-generate Whiteboard tokens (admin for teacher, reader for student)
        if ($booking->whiteboard_room_uuid) {
            try {
                $whiteboardService = app(WhiteboardService::class);
                $whiteboardService->getRoomToken($booking->whiteboard_room_uuid, 'admin');
                $whiteboardService->getRoomToken($booking->whiteboard_room_uuid, 'reader');
            } catch (\Exception $e) {
                Log::warning("Failed to pre-generate Whiteboard tokens for booking #{$booking->id}: " . $e->getMessage());
            }
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::emergency("Virtual Classroom Provisioning FAILED permanently for booking #{$this->booking->id}. Error: " . $exception->getMessage());
        // TODO: Send Slack/Email alert to admins
    }
}
