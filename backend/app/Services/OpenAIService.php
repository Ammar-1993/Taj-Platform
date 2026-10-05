<?php

namespace App\Services;

use App\Models\Booking;
use Exception;
use OpenAI;
use OpenAI\Contracts\ClientContract;
use RuntimeException;

class OpenAIService
{
    protected ?ClientContract $client;

    protected string $model;

    public function __construct(?ClientContract $client = null)
    {
        $apiKey = config('services.openai.api_key');
        $organization = config('services.openai.organization');

        if ($client !== null) {
            $this->client = $client;
        } elseif (! empty($apiKey)) {
            $factory = OpenAI::factory()->withApiKey($apiKey);
            if (! empty($organization)) {
                $factory = $factory->withOrganization($organization);
            }
            $this->client = $factory->make();
        } else {
            $this->client = null;
        }

        $this->model = config('services.openai.model', 'gpt-4o-mini');
    }

    /**
     * Check if OpenAI client is properly configured.
     */
    public function isConfigured(): bool
    {
        return $this->client !== null;
    }

    /**
     * Generate session summary and interactive quiz for a completed booking.
     *
     * @return array{
     *     summary: string,
     *     key_takeaways: array<string>,
     *     quiz_title: string,
     *     questions: array<int, array{id: int, question: string, options: array<string>, correct_answer_index: int, explanation: string}>,
     *     model_used: string,
     *     tokens_used: int|null
     * }
     *
     * @throws RuntimeException
     */
    public function generateSessionSummaryAndQuiz(Booking $booking): array
    {
        if ($this->client === null) {
            throw new RuntimeException('OpenAI client is not configured. Missing OPENAI_API_KEY.');
        }

        $subjectName = $booking->teacher?->teacherProfile?->subject?->name_ar
            ?? $booking->teacher?->teacherProfile?->subject?->name
            ?? 'مادة تعليمية';

        $gradeLevel = $booking->student?->studentProfile?->gradeLevel?->name_ar
            ?? $booking->student?->studentProfile?->gradeLevel?->name
            ?? 'المرحلة الدراسية';

        $notesOrTopic = $booking->metadata['topic']
            ?? $booking->metadata['notes']
            ?? 'مفاهيم الدرس الأساسية وتطبيقاتها';

        $systemPrompt = <<<'PROMPT'
أنت مستشار تربوي وخبير تعليمي ذكي لمنصة "تاج التعليمية".
مهمتك هي مراجعة سياق الجلسة التعليمية التي انتهت للتو، وتقديم:
1. ملخص تشجيعي وشامل بأسلوب Markdown ممتع ومحفز للطالب باللغة العربية.
2. قائمة بأهم 3 إلى 5 نقاط رئيسية مستفادة (Key Takeaways).
3. اختبار قصير تفاعلي (Quiz) مكون من 3 أسئلة اختيار من متعدد مع شرح مبسط لكل إجابة.

يجب أن تكون مخرجاتك كائن JSON فقط بالهيكل التالي:
{
  "summary": "نص الملخص الشامل بتنسيق Markdown المشجع",
  "key_takeaways": ["نقطة رئيسية 1", "نقطة رئيسية 2", "نقطة رئيسية 3"],
  "quiz": {
    "title": "عنوان الاختبار القصير",
    "questions": [
      {
        "id": 1,
        "question": "نص السؤال؟",
        "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
        "correct_answer_index": 0,
        "explanation": "شرح سبب صحة الإجابة"
      }
    ]
  }
}
PROMPT;

        $userPrompt = <<<PROMPT
سياق الجلسة التعليمية:
- المادة: {$subjectName}
- المرحلة التعليمية: {$gradeLevel}
- موضوع الجلسة والملاحظات: {$notesOrTopic}
PROMPT;

        try {
            $response = $this->client->chat()->create([
                'model' => $this->model,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'temperature' => 0.7,
                'max_tokens' => 1500,
            ]);

            $content = $response->choices[0]->message->content ?? '';
            $data = json_decode($content, true);

            if (! is_array($data) || ! isset($data['summary'])) {
                throw new RuntimeException('Invalid JSON payload returned from OpenAI.');
            }

            return [
                'summary' => $data['summary'] ?? '',
                'key_takeaways' => $data['key_takeaways'] ?? [],
                'quiz_title' => $data['quiz']['title'] ?? 'اختبار فهم الجلسة',
                'questions' => $data['quiz']['questions'] ?? [],
                'model_used' => $response->model ?? $this->model,
                'tokens_used' => $response->usage?->totalTokens ?? null,
            ];
        } catch (Exception $e) {
            throw new RuntimeException('OpenAI generation failed: '.$e->getMessage(), 0, $e);
        }
    }
}
