<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PaymentConfirmationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    protected PaymentConfirmationService $paymentConfirmation;

    public function __construct(PaymentConfirmationService $paymentConfirmation)
    {
        $this->paymentConfirmation = $paymentConfirmation;
    }

    /**
     * Create a payment session with Moyasar gateway
     */
    public function create(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:10|max:5000',
        ]);

        $amount = $request->input('amount');
        $user = $request->user();
        $amountInHalalas = $amount * 100;

        try {
            // 🟢 تجهيز رابط الواجهة الأمامية مع رابط احتياطي للحماية
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            // التأكد من إزالة أي / زائدة في نهاية الرابط
            $frontendUrl = rtrim($frontendUrl, '/');

            $response = Http::withHeaders([
                'Authorization' => 'Basic '.base64_encode(config('services.moyasar.secret_key').':'),
                'Content-Type' => 'application/json',
            ])->post('https://api.moyasar.com/v1/invoices', [
                'amount' => $amountInHalalas,
                'currency' => 'SAR',
                'description' => 'شحن المحفظة - '.$user->name,
                // 🟢 استخدام المتغير المحمي
                'success_url' => $frontendUrl.'/dashboard/top-up/success',
                'back_url' => $frontendUrl.'/dashboard/top-up',
                'metadata' => [
                    'user_id' => $user->id,
                    'type' => 'wallet_topup',
                ],
            ]);

            if ($response->successful()) {
                $invoiceData = $response->json();

                return response()->json([
                    'status' => 'success',
                    'data' => [
                        'payment_id' => $invoiceData['id'],
                        'checkout_url' => $invoiceData['url'],
                        'amount' => $amount,
                        'status' => $invoiceData['status'],
                    ],
                ]);
            } else {
                return response()->json([
                    'error' => 'فشل في إنشاء جلسة الدفع',
                    'moyasar_error_details' => $response->json(),
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'خطأ في الاتصال ببوابة الدفع',
                'exception_details' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * التحقق من حالة الدفع يدوياً (للتغلب على تأخر الويب هوك)
     */
    public function verify(Request $request)
    {
        $request->validate([
            'id' => ['required', 'string', 'max:100', 'regex:/^[A-Za-z0-9_-]+$/'],
        ]);

        $id = $request->input('id');
        $user = $request->user();

        try {
            // 🟢 المحاولة الأولى: التحقق كعملية دفع (Payment) لأن ميسر يرسل رقم الدفع غالباً في الرابط
            $response = Http::withHeaders([
                'Authorization' => 'Basic '.base64_encode(config('services.moyasar.secret_key').':'),
            ])->get("https://api.moyasar.com/v1/payments/{$id}");

            $invoiceData = null;
            // القيم المالية المؤكدة من ميسر (مصدر الحقيقة الوحيد)
            $confirmed = null;

            if ($response->successful()) {
                $paymentData = $response->json();
                $linkedInvoiceId = $paymentData['invoice_id'] ?? null;

                // إذا كان الدفع مرتبطاً بفاتورة، نجلب بيانات الفاتورة للحصول على الـ metadata
                if ($linkedInvoiceId) {
                    $invoiceResponse = Http::withHeaders([
                        'Authorization' => 'Basic '.base64_encode(config('services.moyasar.secret_key').':'),
                    ])->get("https://api.moyasar.com/v1/invoices/{$linkedInvoiceId}");

                    if ($invoiceResponse->successful()) {
                        $invoiceData = $invoiceResponse->json();
                        // نستخدم حالة ومبلغ الدفع الأصلي المؤكد
                        $invoiceData['status'] = $paymentData['status'] ?? null;
                        $confirmed = [
                            'status' => $paymentData['status'] ?? null,
                            'amount' => (int) ($paymentData['amount'] ?? 0),
                            'currency' => $paymentData['currency'] ?? null,
                            'metadata' => $invoiceData['metadata'] ?? null,
                            'payment_id' => $paymentData['id'] ?? null,
                            'invoice_id' => $linkedInvoiceId,
                        ];
                    }
                } else {
                    // إذا لم تكن هناك فاتورة، نستخدم بيانات الدفع مباشرة (إذا كانت الـ metadata موجودة هناك)
                    $invoiceData = $paymentData;
                    $confirmed = [
                        'status' => $paymentData['status'] ?? null,
                        'amount' => (int) ($paymentData['amount'] ?? 0),
                        'currency' => $paymentData['currency'] ?? null,
                        'metadata' => $paymentData['metadata'] ?? null,
                        'payment_id' => $paymentData['id'] ?? null,
                        'invoice_id' => null,
                    ];
                }
            } else {
                // 🟢 المحاولة الثانية: التحقق كفاتورة مباشرة (Invoice)
                $response = Http::withHeaders([
                    'Authorization' => 'Basic '.base64_encode(config('services.moyasar.secret_key').':'),
                ])->get("https://api.moyasar.com/v1/invoices/{$id}");

                if ($response->successful()) {
                    $invoiceData = $response->json();

                    // أول دفعة ناجحة داخل الفاتورة (إن وجدت) لمطابقة السجلات القديمة
                    $paidPaymentId = collect($invoiceData['payments'] ?? [])
                        ->first(fn ($p) => in_array($p['status'] ?? null, ['paid', 'completed'], true))['id'] ?? null;

                    $confirmed = [
                        'status' => $invoiceData['status'] ?? null,
                        'amount' => (int) ($invoiceData['amount'] ?? 0),
                        'currency' => $invoiceData['currency'] ?? null,
                        'metadata' => $invoiceData['metadata'] ?? null,
                        'payment_id' => $paidPaymentId,
                        'invoice_id' => $invoiceData['id'] ?? $id,
                    ];
                }
            }

            if ($invoiceData && $confirmed) {
                Log::info('Moyasar Verification Success (Manual):', [
                    'id' => $id,
                    'status' => $confirmed['status'],
                    'invoice_id' => $confirmed['invoice_id'],
                    'payment_id' => $confirmed['payment_id'],
                ]);

                // التأكد من أن الدفعة مدفوعة وتخص المستخدم الحالي، ثم الإيداع مرة واحدة فقط (Idempotent)
                $result = $this->paymentConfirmation->confirmWalletTopup(
                    $confirmed['status'],
                    $confirmed['amount'],
                    $confirmed['currency'],
                    $confirmed['metadata'],
                    $confirmed['payment_id'],
                    $confirmed['invoice_id'],
                    (int) $user->id,
                    'manual',
                );

                if (in_array($result['status'], [PaymentConfirmationService::CREDITED, PaymentConfirmationService::DUPLICATE], true)) {
                    return response()->json([
                        'status' => 'success',
                        'message' => 'تم التحقق من الدفع وتحديث الرصيد',
                        'balance' => $user->wallet()->first()->balance,
                    ]);
                }

                return response()->json([
                    'status' => 'pending',
                    'message' => 'الدفع لا يزال قيد المعالجة أو لم يكتمل',
                    'moyasar_status' => $confirmed['status'],
                ]);
            }

            Log::error('Moyasar Verification Failed:', [
                'status' => $response->status(),
                'body' => $response->body(),
                'id' => $id,
            ]);

            return response()->json([
                'error' => 'فشل في الاتصال بميسر أو الفاتورة غير موجودة',
                'moyasar_status' => $response->status(),
                'id_sent' => $id,
            ], 400);

        } catch (\Exception $e) {
            Log::error('Error verifying payment: '.$e->getMessage());

            return response()->json(['error' => 'خطأ في معالجة طلب التحقق'], 500);
        }
    }

    /**
     * مسار الويب هوك لاستقبال تنبيهات الدفع (Fail-Closed)
     */
    public function webhook(Request $request)
    {
        Log::info('Payment Webhook Received:', [
            'type' => $request->input('type'),
            'payment_id' => $request->input('data.id'),
            'status' => $request->input('data.status'),
        ]);

        $webhookSecret = (string) config('services.moyasar.webhook_secret');

        // 🔴 Fail-Closed: بدون سر مُعدّ لا يمكن التحقق، فنرفض كل الطلبات
        if ($webhookSecret === '') {
            Log::error('Moyasar webhook rejected: MOYASAR_WEBHOOK_SECRET is not configured');

            return response()->json(['error' => 'Webhook not configured'], 503);
        }

        if (! $this->hasValidWebhookAuthentication($request, $webhookSecret)) {
            Log::warning('Invalid or missing webhook signature');

            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $paymentId = $request->input('data.id');
        if (! is_string($paymentId) || ! preg_match('/^[A-Za-z0-9_-]{1,100}$/', $paymentId)) {
            return response()->json(['message' => 'تم تجاهل الطلب أو الحالة غير صالحة'], 400);
        }

        // 🔐 لا نثق بقيم الطلب الواردة: نجلب الدفعة الفعلية من ميسر ونعتمد قيمها (الحالة/المبلغ/العملة)
        try {
            $paymentResponse = $this->moyasarGet("payments/{$paymentId}");

            if ($paymentResponse->serverError()) {
                return response()->json(['error' => 'تعذر التحقق من الدفعة حالياً'], 503);
            }

            if (! $paymentResponse->successful()) {
                Log::warning('Webhook payment not found at Moyasar', ['payment_id' => $paymentId, 'http' => $paymentResponse->status()]);

                return response()->json(['message' => 'تم تجاهل الطلب أو الحالة غير صالحة'], 400);
            }

            $payment = $paymentResponse->json();
            $invoiceId = $payment['invoice_id'] ?? null;
            $metadata = $payment['metadata'] ?? null;

            // metadata الفاتورة الأصلية (التي أنشأناها نحن) هي المرجع الأوثق
            if ($invoiceId) {
                $invoiceResponse = $this->moyasarGet("invoices/{$invoiceId}");

                if ($invoiceResponse->serverError()) {
                    return response()->json(['error' => 'تعذر التحقق من الفاتورة حالياً'], 503);
                }

                if ($invoiceResponse->successful() && ! empty($invoiceResponse->json('metadata'))) {
                    $metadata = $invoiceResponse->json('metadata');
                }
            }

            $result = $this->paymentConfirmation->confirmWalletTopup(
                $payment['status'] ?? null,
                (int) ($payment['amount'] ?? 0),
                $payment['currency'] ?? null,
                $metadata,
                $payment['id'] ?? $paymentId,
                $invoiceId,
                null,
                'webhook',
            );
        } catch (\Throwable $e) {
            Log::error('فشل في معالجة الويب هوك: '.$e->getMessage());

            return response()->json(['error' => 'خطأ داخلي في السيرفر'], 500);
        }

        if ($result['status'] === PaymentConfirmationService::CREDITED) {
            return response()->json(['message' => 'تم شحن المحفظة بنجاح'], 200);
        }

        if ($result['status'] === PaymentConfirmationService::DUPLICATE) {
            // 200 حتى يتوقف ميسر عن إعادة المحاولة؛ لا يُضاف رصيد مرة ثانية
            return response()->json(['message' => 'تمت معالجة هذه الدفعة مسبقاً'], 200);
        }

        return response()->json(['message' => 'تم تجاهل الطلب أو الحالة غير صالحة'], 400);
    }

    /**
     * يقبل الطلب فقط إذا كان توقيع HMAC صحيحاً في الترويسة، أو secret_token المطابق في جسم الطلب (طريقة ميسر).
     */
    private function hasValidWebhookAuthentication(Request $request, string $secret): bool
    {
        $signature = $request->header('X-Moyasar-Signature');
        if (is_string($signature) && $signature !== '') {
            $expected = hash_hmac('sha256', $request->getContent(), $secret);

            if (hash_equals($expected, $signature)) {
                return true;
            }
        }

        $bodyToken = $request->input('secret_token');

        return is_string($bodyToken) && $bodyToken !== '' && hash_equals($secret, $bodyToken);
    }

    private function moyasarGet(string $path)
    {
        return Http::withHeaders([
            'Authorization' => 'Basic '.base64_encode(config('services.moyasar.secret_key').':'),
        ])->get('https://api.moyasar.com/v1/'.$path);
    }
}
