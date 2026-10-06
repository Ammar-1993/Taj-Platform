<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OpenAIService;
use App\Services\SupportKnowledgeBase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class SupportChatController extends Controller
{
    public function __construct(
        protected OpenAIService $openAIService
    ) {}

    /**
     * Handle support conversation with Taj AI Assistant.
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'messages' => 'required|array|min:1|max:20',
            'messages.*.role' => 'required|string|in:user,assistant,system',
            'messages.*.content' => 'required|string|max:2000',
        ]);

        if (! $this->openAIService->isConfigured()) {
            return response()->json([
                'status' => 'unavailable',
                'message' => 'خدمة المساعد الذكي غير مهيأة حالياً.',
                'data' => [
                    'reply' => 'عذراً، خدمة المساعد الذكي تخضع للصيانة حالياً. يسعدنا تقديم المساعدة المباشرة لك عبر خيارات الدعم التالية:',
                    'needs_human_support' => true,
                    'support_options' => [
                        'whatsapp' => [
                            'phone' => SupportKnowledgeBase::SUPPORT_WHATSAPP_NUMBER,
                            'link' => SupportKnowledgeBase::buildWhatsAppLink('مرحباً فريق تاج، أود الاستفسار عن...'),
                            'label' => 'التحدث مع موظف الدعم عبر واتساب ('.SupportKnowledgeBase::SUPPORT_WHATSAPP_NUMBER.')',
                        ],
                        'ticket' => [
                            'link' => SupportKnowledgeBase::SUPPORT_TICKET_PATH,
                            'label' => 'فتح تذكرة دعم فني',
                        ],
                    ],
                    'suggested_questions' => [],
                ],
            ], 200);
        }

        // Resolves user if Bearer token is provided via Sanctum, otherwise null for guests
        $user = $request->user('sanctum');

        try {
            $result = $this->openAIService->chatWithSupportAssistant($validated['messages'], $user);

            return response()->json([
                'status' => 'success',
                'data' => $result,
            ]);
        } catch (Throwable $e) {
            Log::error('Support assistant error: '.$e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'حدث خطأ مؤقت أثناء معالجة المحادثة.',
                'data' => [
                    'reply' => 'نعتذر منك، حدث خطأ مؤقت أثناء معالجة طلبك. يمكنك إعادة المحاولة أو التواصل المباشر مع فريق الدعم عبر الخيارات أدناه:',
                    'needs_human_support' => true,
                    'support_options' => [
                        'whatsapp' => [
                            'phone' => SupportKnowledgeBase::SUPPORT_WHATSAPP_NUMBER,
                            'link' => SupportKnowledgeBase::buildWhatsAppLink('مرحباً فريق تاج، أود الاستفسار عن...'),
                            'label' => 'التحدث مع موظف الدعم عبر واتساب ('.SupportKnowledgeBase::SUPPORT_WHATSAPP_NUMBER.')',
                        ],
                        'ticket' => [
                            'link' => SupportKnowledgeBase::SUPPORT_TICKET_PATH,
                            'label' => 'فتح تذكرة دعم فني',
                        ],
                    ],
                    'suggested_questions' => [],
                ],
            ], 500);
        }
    }
}
