<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Models\SessionQuiz;
use App\Models\SessionSummary;
use App\Services\OpenAIService;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

class GenerateSessionSummaryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 60;

    public array $backoff = [10, 30, 60];

    /**
     * Create a new job instance.
     */
    public function __construct(public Booking $booking) {}

    /**
     * Execute the job.
     */
    public function handle(OpenAIService $openAIService): void
    {
        $lock = Cache::lock("generate_session_summary_{$this->booking->id}", 120);

        if (! $lock->get()) {
            Log::info("Session summary generation already in progress for booking #{$this->booking->id}");

            return;
        }

        /** @var SessionSummary $summary */
        $summary = SessionSummary::firstOrCreate(
            ['booking_id' => $this->booking->id],
            ['status' => 'pending']
        );

        if ($summary->status === 'completed' && ! empty($summary->summary_content)) {
            Log::info("Session summary already completed for booking #{$this->booking->id}");
            $lock->release();

            return;
        }

        if (! $openAIService->isConfigured()) {
            Log::info("OpenAI service is not configured. Skipping session summary generation for booking #{$this->booking->id}");
            $summary->update([
                'status' => 'failed',
                'error_message' => 'خدمة الذكاء الاصطناعي غير مهيأة حالياً.',
            ]);
            $lock->release();

            return;
        }

        try {
            $summary->update(['status' => 'pending', 'error_message' => null]);

            $result = $openAIService->generateSessionSummaryAndQuiz($this->booking);

            $summary->update([
                'summary_content' => $result['summary'],
                'key_takeaways' => $result['key_takeaways'],
                'status' => 'completed',
                'model_used' => $result['model_used'],
                'tokens_used' => $result['tokens_used'],
                'error_message' => null,
            ]);

            SessionQuiz::updateOrCreate(
                [
                    'session_summary_id' => $summary->id,
                    'booking_id' => $this->booking->id,
                ],
                [
                    'title' => $result['quiz_title'],
                    'questions' => $result['questions'],
                    'total_questions' => count($result['questions']),
                ]
            );

            Log::info("Session summary and quiz successfully generated for booking #{$this->booking->id}");
        } catch (Exception $e) {
            $summary->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            Log::error("Failed to generate session summary for booking #{$this->booking->id}: ".$e->getMessage());

            throw $e;
        } finally {
            $lock->release();
        }
    }

    /**
     * Handle a permanent job failure.
     */
    public function failed(Throwable $exception): void
    {
        Log::error("GenerateSessionSummaryJob permanently failed for booking #{$this->booking->id}. Reason: ".$exception->getMessage());

        SessionSummary::updateOrCreate(
            ['booking_id' => $this->booking->id],
            [
                'status' => 'failed',
                'error_message' => $exception->getMessage(),
            ]
        );
    }
}
