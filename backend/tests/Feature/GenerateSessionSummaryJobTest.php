<?php

namespace Tests\Feature;

use App\Jobs\GenerateSessionSummaryJob;
use App\Models\Booking;
use App\Models\SessionSummary;
use App\Models\TeacherSlot;
use App\Models\User;
use App\Services\OpenAIService;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class GenerateSessionSummaryJobTest extends TestCase
{
    use RefreshDatabase;

    private function createDummyBooking(): Booking
    {
        $uid = uniqid();
        $teacher = User::create([
            'name' => 'Teacher One',
            'email' => "teacher_{$uid}@example.com",
            'phone' => '05'.substr(str_shuffle('01234567890123456789'), 0, 8),
            'password' => 'secret123',
        ]);

        $student = User::create([
            'name' => 'Student One',
            'email' => "student_{$uid}@example.com",
            'phone' => '05'.substr(str_shuffle('01234567890123456789'), 0, 8),
            'password' => 'secret123',
        ]);

        $slot = TeacherSlot::create([
            'teacher_id' => $teacher->id,
            'slot_date' => now()->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'status' => 'booked',
        ]);

        return Booking::create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'booked_by_id' => $student->id,
            'teacher_slot_id' => $slot->id,
            'booking_date' => now(),
            'session_price' => 100.00,
            'discount_amount' => 0.00,
            'net_paid' => 100.00,
            'status' => 'completed',
            'agora_channel' => 'taj_'.uniqid(),
        ]);
    }

    public function test_job_successfully_generates_and_stores_summary_and_quiz(): void
    {
        $booking = $this->createDummyBooking();

        $openAiMock = Mockery::mock(OpenAIService::class);
        $openAiMock->shouldReceive('isConfigured')
            ->once()
            ->andReturn(true);

        $openAiMock->shouldReceive('generateSessionSummaryAndQuiz')
            ->once()
            ->with(Mockery::on(fn (Booking $b) => $b->id === $booking->id))
            ->andReturn([
                'summary' => 'ملخص الجلسة التعليمية المكتمل بنجاح.',
                'key_takeaways' => ['النقطة الأولى', 'النقطة الثانية'],
                'quiz_title' => 'اختبار الجلسة',
                'questions' => [
                    [
                        'id' => 1,
                        'question' => 'ما ناتج 5 + 5؟',
                        'options' => ['10', '20', '15', '5'],
                        'correct_answer_index' => 0,
                        'explanation' => '5 + 5 = 10',
                    ],
                ],
                'model_used' => 'gpt-4o-mini',
                'tokens_used' => 200,
            ]);

        $job = new GenerateSessionSummaryJob($booking);
        $job->handle($openAiMock);

        $this->assertDatabaseHas('session_summaries', [
            'booking_id' => $booking->id,
            'status' => 'completed',
            'model_used' => 'gpt-4o-mini',
            'tokens_used' => 200,
        ]);

        $summary = SessionSummary::where('booking_id', $booking->id)->first();
        $this->assertNotNull($summary);
        $this->assertEquals('ملخص الجلسة التعليمية المكتمل بنجاح.', $summary->summary_content);
        $this->assertCount(2, $summary->key_takeaways);

        $this->assertDatabaseHas('session_quizzes', [
            'booking_id' => $booking->id,
            'session_summary_id' => $summary->id,
            'total_questions' => 1,
            'title' => 'اختبار الجلسة',
        ]);
    }

    public function test_job_handles_failure_gracefully_and_updates_summary_status(): void
    {
        $booking = $this->createDummyBooking();

        $openAiMock = Mockery::mock(OpenAIService::class);
        $openAiMock->shouldReceive('isConfigured')
            ->once()
            ->andReturn(true);

        $openAiMock->shouldReceive('generateSessionSummaryAndQuiz')
            ->once()
            ->andThrow(new Exception('OpenAI API connection timeout.'));

        $job = new GenerateSessionSummaryJob($booking);

        try {
            $job->handle($openAiMock);
            $this->fail('Expected exception to be rethrown for queue retry.');
        } catch (Exception $e) {
            $this->assertEquals('OpenAI API connection timeout.', $e->getMessage());
        }

        $this->assertDatabaseHas('session_summaries', [
            'booking_id' => $booking->id,
            'status' => 'failed',
            'error_message' => 'OpenAI API connection timeout.',
        ]);
    }

    public function test_job_skips_processing_if_already_completed(): void
    {
        $booking = $this->createDummyBooking();

        SessionSummary::create([
            'booking_id' => $booking->id,
            'summary_content' => 'ملخص موجود مسبقاً',
            'status' => 'completed',
        ]);

        $openAiMock = Mockery::mock(OpenAIService::class);
        $openAiMock->shouldNotReceive('generateSessionSummaryAndQuiz');

        $job = new GenerateSessionSummaryJob($booking);
        $job->handle($openAiMock);

        $this->assertDatabaseHas('session_summaries', [
            'booking_id' => $booking->id,
            'summary_content' => 'ملخص موجود مسبقاً',
            'status' => 'completed',
        ]);
    }

    public function test_job_handles_unconfigured_openai_service_peacefully(): void
    {
        $booking = $this->createDummyBooking();

        $openAiMock = Mockery::mock(OpenAIService::class);
        $openAiMock->shouldReceive('isConfigured')
            ->once()
            ->andReturn(false);

        $openAiMock->shouldNotReceive('generateSessionSummaryAndQuiz');

        $job = new GenerateSessionSummaryJob($booking);
        $job->handle($openAiMock);

        $this->assertDatabaseHas('session_summaries', [
            'booking_id' => $booking->id,
            'status' => 'failed',
            'error_message' => 'خدمة الذكاء الاصطناعي غير مهيأة حالياً.',
        ]);
    }
}
