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

class ProvisionVirtualClassroom implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

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
        // Skip if already provisioned
        if ($this->booking->whiteboard_room_uuid) {
            return;
        }

        try {
            $roomName = "حصة: " . ($this->booking->student->name ?? 'طالب') . " مع " . ($this->booking->teacher->name ?? 'معلم');
            $uuid = $whiteboardService->createRoom($roomName);
            
            $this->booking->update([
                'whiteboard_room_uuid' => $uuid
            ]);
            
            Log::info("Virtual classroom provisioned for booking #{$this->booking->id}");
        } catch (\Exception $e) {
            Log::error("Failed to provision virtual classroom for booking #{$this->booking->id}: " . $e->getMessage());
            
            // Fail the job so it can be retried
            throw $e;
        }
    }
}
