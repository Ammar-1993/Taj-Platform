<?php

namespace Tests\Unit;

use App\Models\User;
use App\Services\OpenAIService;
use App\Services\SupportKnowledgeBase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use OpenAI\Responses\Chat\CreateResponse;
use OpenAI\Testing\ClientFake;
use RuntimeException;
use Tests\TestCase;

class SupportKnowledgeBaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_system_prompt_includes_core_faq_and_support_channels(): void
    {
        $prompt = SupportKnowledgeBase::getSystemPrompt();

        $this->assertStringContainsString('تاج التعليمية', $prompt);
        $this->assertStringContainsString('التجميد المالي الآمن', $prompt);
        $this->assertStringContainsString('+967774344625', $prompt);
        $this->assertStringContainsString('/dashboard/support', $prompt);
        $this->assertStringContainsString('زائر (غير مسجل الدخول)', $prompt);
    }

    public function test_system_prompt_tailors_user_role_context(): void
    {
        $user = new User([
            'name' => 'أحمد علي',
            'email' => 'ahmed@example.com',
        ]);

        $prompt = SupportKnowledgeBase::getSystemPrompt($user);

        $this->assertStringContainsString('أحمد علي', $prompt);
    }

    public function test_build_whatsapp_link_formats_number_and_message(): void
    {
        $link = SupportKnowledgeBase::buildWhatsAppLink('طلب استرداد تجريبي');

        $this->assertStringStartsWith('https://wa.me/967774344625?text=', $link);
        $this->assertStringContainsString(urlencode('طلب استرداد تجريبي'), $link);
    }

    public function test_chat_with_support_assistant_answers_general_question(): void
    {
        $fakeAiPayload = [
            'reply' => 'يمكنك بدء حجز أول حصة من خلال اختيار المادة والمعلم المناسب من الصفحة الرئيسية.',
            'needs_human_support' => false,
            'support_options' => null,
            'suggested_questions' => [
                'ما هي وسائل الدفع المتاحة؟',
                'كيف أضمن حقي المالي؟',
            ],
        ];

        $clientFake = new ClientFake([
            CreateResponse::fake([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode($fakeAiPayload, JSON_UNESCAPED_UNICODE),
                        ],
                    ],
                ],
                'usage' => [
                    'total_tokens' => 240,
                ],
            ]),
        ]);

        $service = new OpenAIService($clientFake);

        $result = $service->chatWithSupportAssistant([
            ['role' => 'user', 'content' => 'كيف أحجز حصتي الأولى؟'],
        ]);

        $this->assertFalse($result['needs_human_support']);
        $this->assertNull($result['support_options']);
        $this->assertStringContainsString('حجز أول حصة', $result['reply']);
        $this->assertCount(2, $result['suggested_questions']);
        $this->assertEquals(240, $result['tokens_used']);
    }

    public function test_chat_with_support_assistant_triggers_both_whatsapp_and_ticket_on_complaint_or_complex_refund(): void
    {
        $fakeAiPayload = [
            'reply' => 'نأسف لحدوث هذا الأمر وسماعك غير راضٍ. يمكنك التحدث مباشرة مع موظف الدعم أو فتح تذكرة دعم فني وسنتابع المشكلة فوراً.',
            'needs_human_support' => true,
            'support_options' => null,
            'suggested_questions' => [],
        ];

        $clientFake = new ClientFake([
            CreateResponse::fake([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode($fakeAiPayload, JSON_UNESCAPED_UNICODE),
                        ],
                    ],
                ],
                'usage' => [
                    'total_tokens' => 310,
                ],
            ]),
        ]);

        $service = new OpenAIService($clientFake);

        $result = $service->chatWithSupportAssistant([
            ['role' => 'user', 'content' => 'أريد رفع شكوى رسمية وطلب استرداد أموال لحصة متنازع عليها'],
        ]);

        $this->assertTrue($result['needs_human_support']);
        $this->assertNotNull($result['support_options']);

        // 1. خيار الواتسآب المباشر (+967774344625)
        $this->assertArrayHasKey('whatsapp', $result['support_options']);
        $this->assertEquals('+967774344625', $result['support_options']['whatsapp']['phone']);
        $this->assertStringContainsString('https://wa.me/967774344625', $result['support_options']['whatsapp']['link']);

        // 2. خيار تذكرة الدعم الفني عبر المنصة
        $this->assertArrayHasKey('ticket', $result['support_options']);
        $this->assertEquals('/dashboard/support', $result['support_options']['ticket']['link']);
    }

    public function test_chat_throws_exception_when_client_not_configured(): void
    {
        config(['services.openai.api_key' => '']);
        $service = new OpenAIService(null);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('OpenAI client is not configured');

        $service->chatWithSupportAssistant([
            ['role' => 'user', 'content' => 'مرحبا'],
        ]);
    }
}
