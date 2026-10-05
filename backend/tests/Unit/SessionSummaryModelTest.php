<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Models\SessionQuiz;
use App\Models\SessionSummary;
use App\Models\TeacherSlot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionSummaryModelTest extends TestCase
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

    public function test_session_summary_can_be_created_and_associated_with_booking(): void
    {
        $booking = $this->createDummyBooking();

        $summary = SessionSummary::create([
            'booking_id' => $booking->id,
            'summary_content' => 'تم شرح درس المعادلات التربيعية وطريقة حلها بالقانون العام.',
            'key_takeaways' => ['القانون العام', 'المميز وحالاته', 'التحليل بالتجربة'],
            'status' => 'completed',
            'model_used' => 'gpt-4o-mini',
            'tokens_used' => 350,
        ]);

        $this->assertDatabaseHas('session_summaries', [
            'id' => $summary->id,
            'booking_id' => $booking->id,
            'status' => 'completed',
            'model_used' => 'gpt-4o-mini',
        ]);

        $this->assertInstanceOf(Booking::class, $summary->booking);
        $this->assertEquals($booking->id, $summary->booking->id);
        $this->assertIsArray($summary->key_takeaways);
        $this->assertCount(3, $summary->key_takeaways);
        $this->assertEquals('القانون العام', $summary->key_takeaways[0]);

        // Test relationship on Booking model
        $this->assertInstanceOf(SessionSummary::class, $booking->fresh()->sessionSummary);
        $this->assertEquals($summary->id, $booking->fresh()->sessionSummary->id);
    }

    public function test_session_quiz_can_be_created_and_linked_to_summary(): void
    {
        $booking = $this->createDummyBooking();

        $summary = SessionSummary::create([
            'booking_id' => $booking->id,
            'summary_content' => 'ملخص الجلسة',
            'status' => 'completed',
        ]);

        $questionsData = [
            [
                'id' => 1,
                'question' => 'ما هو المميز في المعادلة التربيعية؟',
                'options' => ['b^2 - 4ac', '-b / 2a', 'a^2 + b^2', '2ab'],
                'correct_answer_index' => 0,
                'explanation' => 'المميز يحسب بالصيغة b^2 - 4ac',
            ],
        ];

        $quiz = SessionQuiz::create([
            'session_summary_id' => $summary->id,
            'booking_id' => $booking->id,
            'title' => 'اختبار قصير: المعادلات التربيعية',
            'questions' => $questionsData,
            'total_questions' => 1,
        ]);

        $this->assertDatabaseHas('session_quizzes', [
            'id' => $quiz->id,
            'session_summary_id' => $summary->id,
            'booking_id' => $booking->id,
            'total_questions' => 1,
        ]);

        $this->assertInstanceOf(SessionSummary::class, $quiz->sessionSummary);
        $this->assertInstanceOf(Booking::class, $quiz->booking);
        $this->assertIsArray($quiz->questions);
        $this->assertEquals('b^2 - 4ac', $quiz->questions[0]['options'][0]);

        // Check inverse relationship from summary to quiz
        $this->assertInstanceOf(SessionQuiz::class, $summary->fresh()->quiz);
        $this->assertEquals($quiz->id, $summary->fresh()->quiz->id);

        // Check relationship from booking to quiz
        $this->assertInstanceOf(SessionQuiz::class, $booking->fresh()->sessionQuiz);
        $this->assertEquals($quiz->id, $booking->fresh()->sessionQuiz->id);
    }

    public function test_deleting_booking_cascades_delete_to_summary_and_quiz(): void
    {
        $booking = $this->createDummyBooking();

        $summary = SessionSummary::create([
            'booking_id' => $booking->id,
            'summary_content' => 'ملخص سيحذف',
            'status' => 'completed',
        ]);

        $quiz = SessionQuiz::create([
            'session_summary_id' => $summary->id,
            'booking_id' => $booking->id,
            'questions' => [],
            'total_questions' => 0,
        ]);

        // Force delete booking to trigger foreign key cascade
        $booking->forceDelete();

        $this->assertDatabaseMissing('session_summaries', ['id' => $summary->id]);
        $this->assertDatabaseMissing('session_quizzes', ['id' => $quiz->id]);
    }
}
