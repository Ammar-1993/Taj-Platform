<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Models\TeacherSlot;
use App\Models\User;
use App\Services\OpenAIService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use OpenAI\Responses\Chat\CreateResponse;
use OpenAI\Testing\ClientFake;
use RuntimeException;
use Tests\TestCase;

class OpenAIServiceTest extends TestCase
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
            'metadata' => [
                'topic' => 'حساب المثلثات والدوال الدائرية',
            ],
        ]);
    }

    public function test_throws_exception_when_client_is_not_configured(): void
    {
        config(['services.openai.api_key' => null]);

        $booking = $this->createDummyBooking();
        $service = new OpenAIService(null);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('OpenAI client is not configured');

        $service->generateSessionSummaryAndQuiz($booking);
    }

    public function test_generates_summary_and_quiz_successfully(): void
    {
        $booking = $this->createDummyBooking();

        $aiPayload = [
            'summary' => 'ملخص ممتاز لدرس حساب المثلثات مع شرح المتطابقات الأساسية.',
            'key_takeaways' => ['متطابقة فيثاغورس', 'قانون الجيب', 'قانون جيب التمام'],
            'quiz' => [
                'title' => 'اختبار حساب المثلثات',
                'questions' => [
                    [
                        'id' => 1,
                        'question' => 'ما هي قيمة sin^2(x) + cos^2(x)؟',
                        'options' => ['1', '0', '-1', '2'],
                        'correct_answer_index' => 0,
                        'explanation' => 'متطابقة فيثاغورس الأساسية تساوي 1 دائماً.',
                    ],
                ],
            ],
        ];

        $clientFake = new ClientFake([
            CreateResponse::fake([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode($aiPayload, JSON_UNESCAPED_UNICODE),
                        ],
                    ],
                ],
                'model' => 'gpt-4o-mini',
                'usage' => [
                    'total_tokens' => 312,
                ],
            ]),
        ]);

        $service = new OpenAIService($clientFake);
        $result = $service->generateSessionSummaryAndQuiz($booking);

        $this->assertEquals('ملخص ممتاز لدرس حساب المثلثات مع شرح المتطابقات الأساسية.', $result['summary']);
        $this->assertCount(3, $result['key_takeaways']);
        $this->assertEquals('اختبار حساب المثلثات', $result['quiz_title']);
        $this->assertCount(1, $result['questions']);
        $this->assertEquals('gpt-4o-mini', $result['model_used']);
        $this->assertEquals(312, $result['tokens_used']);
    }

    public function test_throws_exception_on_invalid_json(): void
    {
        $booking = $this->createDummyBooking();

        $clientFake = new ClientFake([
            CreateResponse::fake([
                'choices' => [
                    [
                        'message' => [
                            'content' => 'Not valid JSON string',
                        ],
                    ],
                ],
                'model' => 'gpt-4o-mini',
            ]),
        ]);

        $service = new OpenAIService($clientFake);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Invalid JSON payload');

        $service->generateSessionSummaryAndQuiz($booking);
    }
}
