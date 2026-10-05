<?php

namespace Tests\Feature;

use App\Jobs\GenerateSessionSummaryJob;
use App\Models\Booking;
use App\Models\SessionQuiz;
use App\Models\SessionSummary;
use App\Models\TeacherSlot;
use App\Models\User;
use App\Services\BookingService;
use App\Services\WalletService;
use App\Services\WhiteboardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Mockery;
use Tests\TestCase;

class SessionSummaryApiTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    private User $student;

    private User $stranger;

    private Booking $booking;

    private SessionSummary $summary;

    private SessionQuiz $quiz;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::create([
            'name' => 'Teacher User',
            'email' => 'teacher_'.uniqid().'@taj.com',
            'phone' => '05'.substr(str_shuffle('01234567890123456789'), 0, 8),
            'password' => bcrypt('password123'),
        ]);

        $this->student = User::create([
            'name' => 'Student User',
            'email' => 'student_'.uniqid().'@taj.com',
            'phone' => '05'.substr(str_shuffle('01234567890123456789'), 0, 8),
            'password' => bcrypt('password123'),
        ]);

        $this->stranger = User::create([
            'name' => 'Stranger User',
            'email' => 'stranger_'.uniqid().'@taj.com',
            'phone' => '05'.substr(str_shuffle('01234567890123456789'), 0, 8),
            'password' => bcrypt('password123'),
        ]);

        $slot = TeacherSlot::create([
            'teacher_id' => $this->teacher->id,
            'slot_date' => now()->toDateString(),
            'start_time' => '14:00:00',
            'end_time' => '15:00:00',
            'status' => 'booked',
        ]);

        $this->booking = Booking::create([
            'student_id' => $this->student->id,
            'teacher_id' => $this->teacher->id,
            'booked_by_id' => $this->student->id,
            'teacher_slot_id' => $slot->id,
            'booking_date' => now(),
            'session_price' => 100.00,
            'discount_amount' => 0.00,
            'net_paid' => 100.00,
            'status' => 'completed',
            'agora_channel' => 'taj_'.uniqid(),
        ]);

        $this->summary = SessionSummary::create([
            'booking_id' => $this->booking->id,
            'summary_content' => 'مراجعة ممتازة للفيزياء النووية وطاقة الربط.',
            'key_takeaways' => ['طاقة الربط النووي', 'منحنى الاستقرار', 'الانشطار والاندماج'],
            'status' => 'completed',
            'model_used' => 'gpt-4o-mini',
            'tokens_used' => 250,
        ]);

        $this->quiz = SessionQuiz::create([
            'session_summary_id' => $this->summary->id,
            'booking_id' => $this->booking->id,
            'title' => 'اختبار الفيزياء النووية',
            'questions' => [
                [
                    'id' => 1,
                    'question' => 'ما هي وحدة قياس النشاط الإشعاعي في النظام الدولي؟',
                    'options' => ['بيكرل', 'جول', 'كوري', 'نيوتن'],
                    'correct_answer_index' => 0,
                    'explanation' => 'البيكرل (Bq) هو الوحدة الدولية للنشاط الإشعاعي.',
                ],
                [
                    'id' => 2,
                    'question' => 'أي الجسيمات التالية يتكون من بروتونين ونيوترونين؟',
                    'options' => ['جسيم بيتا', 'جسيم ألفا', 'فوتون جاما', 'بوزيترون'],
                    'correct_answer_index' => 1,
                    'explanation' => 'جسيم ألفا مطابق لنواة ذرة الهيليوم.',
                ],
            ],
            'total_questions' => 2,
        ]);
    }

    public function test_stranger_cannot_view_session_summary(): void
    {
        $response = $this->actingAs($this->stranger, 'sanctum')
            ->getJson("/api/v1/bookings/{$this->booking->id}/summary");

        $response->assertStatus(403);
    }

    public function test_cannot_view_summary_for_incomplete_booking(): void
    {
        $this->booking->update(['status' => 'scheduled']);

        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/v1/bookings/{$this->booking->id}/summary");

        $response->assertStatus(400)
            ->assertJsonPath('status', 'error');
    }

    public function test_student_can_view_summary_with_hidden_answers_before_quiz_completion(): void
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/v1/bookings/{$this->booking->id}/summary");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.summary.content', 'مراجعة ممتازة للفيزياء النووية وطاقة الربط.')
            ->assertJsonPath('data.quiz.title', 'اختبار الفيزياء النووية');

        // Verify correct_answer_index is NOT visible to student before solving
        $questions = $response->json('data.quiz.questions');
        $this->assertArrayNotHasKey('correct_answer_index', $questions[0]);
    }

    public function test_teacher_can_view_summary_with_correct_answers_visible(): void
    {
        $response = $this->actingAs($this->teacher, 'sanctum')
            ->getJson("/api/v1/bookings/{$this->booking->id}/summary");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $questions = $response->json('data.quiz.questions');
        $this->assertArrayHasKey('correct_answer_index', $questions[0]);
        $this->assertEquals(0, $questions[0]['correct_answer_index']);
    }

    public function test_student_can_submit_quiz_and_receive_graded_results(): void
    {
        $answers = [
            '1' => 0, // Correct (بيكرل)
            '2' => 0, // Incorrect (picked بيتا instead of ألفا)
        ];

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson("/api/v1/bookings/{$this->booking->id}/quiz/submit", [
                'answers' => $answers,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.score', 1)
            ->assertJsonPath('data.total_questions', 2)
            ->assertJsonPath('data.percentage', 50);

        $this->assertDatabaseHas('session_quizzes', [
            'id' => $this->quiz->id,
            'score' => 1,
            'total_questions' => 2,
        ]);

        $quizFresh = $this->quiz->fresh();
        $this->assertNotNull($quizFresh->completed_at);
        $this->assertEquals($answers, $quizFresh->student_answers);
    }

    public function test_teacher_cannot_submit_quiz_for_student(): void
    {
        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson("/api/v1/bookings/{$this->booking->id}/quiz/submit", [
                'answers' => ['1' => 0],
            ]);

        $response->assertStatus(403);
    }

    public function test_participant_can_trigger_summary_generation_manually(): void
    {
        Queue::fake();

        $response = $this->actingAs($this->teacher, 'sanctum')
            ->postJson("/api/v1/bookings/{$this->booking->id}/summary/generate");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        Queue::assertPushed(GenerateSessionSummaryJob::class, function ($job) {
            return $job->booking->id === $this->booking->id;
        });
    }

    public function test_complete_booking_dispatches_generate_session_summary_job(): void
    {
        Queue::fake();

        $walletServiceMock = Mockery::mock(WalletService::class);
        $whiteboardServiceMock = Mockery::mock(WhiteboardService::class);
        $walletServiceMock->shouldReceive('processTransaction')->once();

        $bookingService = new BookingService($walletServiceMock, $whiteboardServiceMock);

        $pendingBooking = Booking::create([
            'student_id' => $this->student->id,
            'teacher_id' => $this->teacher->id,
            'booked_by_id' => $this->student->id,
            'teacher_slot_id' => $this->booking->teacher_slot_id,
            'booking_date' => now(),
            'session_price' => 100.00,
            'discount_amount' => 0.00,
            'net_paid' => 100.00,
            'status' => 'scheduled',
            'agora_channel' => 'taj_'.uniqid(),
        ]);

        $bookingService->completeBooking($pendingBooking);

        Queue::assertPushed(GenerateSessionSummaryJob::class, function ($job) use ($pendingBooking) {
            return $job->booking->id === $pendingBooking->id;
        });
    }
}
