<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\OpenAIService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use OpenAI\Responses\Chat\CreateResponse;
use OpenAI\Responses\Chat\CreateStreamedResponse;
use OpenAI\Testing\ClientFake;
use Tests\TestCase;

class SupportChatApiTest extends TestCase
{
    use RefreshDatabase;

    private function bindFakeOpenAI(array $fakePayload): void
    {
        $clientFake = new ClientFake([
            CreateResponse::fake([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode($fakeAiPayload ?? $fakePayload, JSON_UNESCAPED_UNICODE),
                        ],
                    ],
                ],
                'usage' => [
                    'total_tokens' => 200,
                ],
            ]),
        ]);

        $this->app->instance(OpenAIService::class, new OpenAIService($clientFake));
    }

    public function test_chat_validates_required_fields(): void
    {
        $response = $this->postJson('/api/v1/support/chat', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['messages']);
    }

    public function test_chat_validates_message_roles(): void
    {
        $response = $this->postJson('/api/v1/support/chat', [
            'messages' => [
                ['role' => 'invalid_role', 'content' => 'مرحبا'],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['messages.0.role']);
    }

    public function test_guest_user_can_chat_successfully(): void
    {
        $this->bindFakeOpenAI([
            'reply' => 'أهلاً بك في منصة تاج! يمكنك تصفح قائمة المعلمين وحجز الحصة مباشرة.',
            'needs_human_support' => false,
            'support_options' => null,
            'suggested_questions' => ['كيف أبدأ بحجز أول حصة؟'],
        ]);

        $response = $this->postJson('/api/v1/support/chat', [
            'messages' => [
                ['role' => 'user', 'content' => 'كيف أبدأ في المنصة؟'],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.needs_human_support', false)
            ->assertJsonPath('data.reply', 'أهلاً بك في منصة تاج! يمكنك تصفح قائمة المعلمين وحجز الحصة مباشرة.')
            ->assertJsonPath('data.suggested_questions.0', 'كيف أبدأ بحجز أول حصة؟');
    }

    public function test_authenticated_user_can_chat_with_context(): void
    {
        $user = User::factory()->create([
            'name' => 'سارة المنصوري',
        ]);

        $this->bindFakeOpenAI([
            'reply' => 'مرحباً سارة! كيف يمكنني مساعدتك في حجز الحصة اليوم؟',
            'needs_human_support' => false,
            'support_options' => null,
            'suggested_questions' => [],
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/support/chat', [
            'messages' => [
                ['role' => 'user', 'content' => 'أريد معرفة رصيد محفظتي وكيفية الشحن'],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.reply', 'مرحباً سارة! كيف يمكنني مساعدتك في حجز الحصة اليوم؟');
    }

    public function test_complaint_or_complex_refund_returns_both_whatsapp_and_ticket_options(): void
    {
        $this->bindFakeOpenAI([
            'reply' => 'نأسف جداً لسماع ذلك. يمكنك التحدث فوراً مع موظف الدعم أو فتح تذكرة لمتابعة الأمر.',
            'needs_human_support' => true,
            'support_options' => null,
            'suggested_questions' => [],
        ]);

        $response = $this->postJson('/api/v1/support/chat', [
            'messages' => [
                ['role' => 'user', 'content' => 'أريد تقديم شكوى رسمية واسترداد نقدي معقد'],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.needs_human_support', true)
            ->assertJsonPath('data.support_options.whatsapp.phone', '+967774344625')
            ->assertJsonPath('data.support_options.ticket.link', '/dashboard/support');
    }

    public function test_returns_graceful_response_when_service_is_unconfigured(): void
    {
        config(['services.openai.api_key' => '']);
        $this->app->instance(OpenAIService::class, new OpenAIService(null));

        $response = $this->postJson('/api/v1/support/chat', [
            'messages' => [
                ['role' => 'user', 'content' => 'مرحبا'],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'unavailable')
            ->assertJsonPath('data.needs_human_support', true)
            ->assertJsonPath('data.support_options.whatsapp.phone', '+967774344625')
            ->assertJsonPath('data.support_options.ticket.link', '/dashboard/support');
    }

    private function bindFakeStreamedOpenAI(array $fakePayload): void
    {
        $json = json_encode($fakePayload, JSON_UNESCAPED_UNICODE);
        $fp = fopen('php://temp', 'r+');
        $chunks = mb_str_split($json, 15, 'UTF-8');
        foreach ($chunks as $chunk) {
            $line = json_encode([
                'id' => 'chatcmpl-123',
                'object' => 'chat.completion.chunk',
                'created' => time(),
                'model' => 'gpt-4o-mini',
                'choices' => [
                    [
                        'index' => 0,
                        'delta' => ['content' => $chunk],
                    ],
                ],
            ], JSON_UNESCAPED_UNICODE);
            fwrite($fp, "data: {$line}\n\n");
        }
        fwrite($fp, "data: [DONE]\n\n");
        rewind($fp);

        $clientFake = new ClientFake([
            CreateStreamedResponse::fake($fp),
        ]);

        $this->app->instance(OpenAIService::class, new OpenAIService($clientFake));
    }

    public function test_guest_user_can_stream_chat_via_sse(): void
    {
        $this->bindFakeStreamedOpenAI([
            'reply' => 'أهلاً بك في منصة تاج! يمكنك تصفح قائمة المعلمين وحجز الحصة مباشرة.',
            'needs_human_support' => false,
            'support_options' => null,
            'suggested_questions' => ['كيف أبدأ بحجز أول حصة؟'],
        ]);

        $response = $this->postJson('/api/v1/support/chat', [
            'messages' => [
                ['role' => 'user', 'content' => 'كيف أبدأ في المنصة؟'],
            ],
            'stream' => true,
        ]);

        $response->assertStatus(200);
        $this->assertStringContainsString('text/event-stream', $response->headers->get('Content-Type') ?? '');

        $content = $response->streamedContent();
        $this->assertStringContainsString('event: token', $content);
        $this->assertStringContainsString('event: done', $content);
        $this->assertStringContainsString('منصة تاج', $content);
    }

    public function test_streaming_handles_unconfigured_service(): void
    {
        config(['services.openai.api_key' => '']);
        $this->app->instance(OpenAIService::class, new OpenAIService(null));

        $response = $this->postJson('/api/v1/support/chat', [
            'messages' => [
                ['role' => 'user', 'content' => 'مرحبا'],
            ],
            'stream' => true,
        ]);

        $response->assertStatus(200);
        $this->assertStringContainsString('text/event-stream', $response->headers->get('Content-Type') ?? '');

        $content = $response->streamedContent();
        $this->assertStringContainsString('event: token', $content);
        $this->assertStringContainsString('event: done', $content);
        $this->assertStringContainsString('للصيانة', $content);
    }
}
