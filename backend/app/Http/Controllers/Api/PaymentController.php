<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    protected WalletService $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
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
            'id' => 'required|string',
        ]);

        $id = $request->input('id');
        $user = $request->user();

        try {
            // 🟢 المحاولة الأولى: التحقق كعملية دفع (Payment) لأن ميسر يرسل رقم الدفع غالباً في الرابط
            $response = Http::withHeaders([
                'Authorization' => 'Basic '.base64_encode(config('services.moyasar.secret_key').':'),
            ])->get("https://api.moyasar.com/v1/payments/{$id}");

            $invoiceData = null;

            if ($response->successful()) {
                $paymentData = $response->json();

                // إذا كان الدفع مرتبطاً بفاتورة، نجلب بيانات الفاتورة للحصول على الـ metadata
                if (isset($paymentData['invoice_id']) && $paymentData['invoice_id']) {
                    $invoiceId = $paymentData['invoice_id'];
                    $invoiceResponse = Http::withHeaders([
                        'Authorization' => 'Basic '.base64_encode(config('services.moyasar.secret_key').':'),
                    ])->get("https://api.moyasar.com/v1/invoices/{$invoiceId}");

                    if ($invoiceResponse->successful()) {
                        $invoiceData = $invoiceResponse->json();
                        // نستخدم حالة الدفع الأصلية
                        $invoiceData['status'] = $paymentData['status'];
                    }
                } else {
                    // إذا لم تكن هناك فاتورة، نستخدم بيانات الدفع مباشرة (إذا كانت الـ metadata موجودة هناك)
                    $invoiceData = $paymentData;
                }
            } else {
                // 🟢 المحاولة الثانية: التحقق كفاتورة مباشرة (Invoice)
                $response = Http::withHeaders([
                    'Authorization' => 'Basic '.base64_encode(config('services.moyasar.secret_key').':'),
                ])->get("https://api.moyasar.com/v1/invoices/{$id}");

                if ($response->successful()) {
                    $invoiceData = $response->json();
                }
            }

            if ($invoiceData) {
                Log::info('Moyasar Verification Success (Manual):', $invoiceData);

                // التأكد من أن الفاتورة مدفوعة وتخص المستخدم الحالي
                if (($invoiceData['status'] === 'paid' || $invoiceData['status'] === 'completed') &&
                    isset($invoiceData['metadata']['user_id']) &&
                    (int) $invoiceData['metadata']['user_id'] === $user->id) {

                    // منع تكرار العملية (Idempotency)
                    $existingTransaction = WalletTransaction::where('description', 'LIKE', '%'.$id.'%')
                        ->where('wallet_id', $user->wallet->id)
                        ->first();

                    if (! $existingTransaction) {
                        $amount = $invoiceData['amount'] / 100;

                        $this->walletService->processTransaction(
                            $user,
                            $amount,
                            'deposit',
                            'شحن المحفظة عبر ميسر (تحقق يدوي) - رقم: '.$id
                        );

                        Log::info('Wallet topped up via manual verification', [
                            'user_id' => $user->id,
                            'amount' => $amount,
                            'id' => $id,
                        ]);
                    }

                    return response()->json([
                        'status' => 'success',
                        'message' => 'تم التحقق من الدفع وتحديث الرصيد',
                        'balance' => $user->wallet()->first()->balance,
                    ]);
                }

                return response()->json([
                    'status' => 'pending',
                    'message' => 'الدفع لا يزال قيد المعالجة أو لم يكتمل',
                    'moyasar_status' => $invoiceData['status'],
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
     * مسار الويب هوك لاستقبال تنبيهات الدفع
     */
    public function webhook(Request $request)
    {
        Log::info('Payment Webhook Received:', $request->all());

        $signature = $request->header('X-Moyasar-Signature');
        $webhookSecret = config('services.moyasar.webhook_secret');

        if ($webhookSecret && $signature) {
            $expectedSignature = hash_hmac('sha256', $request->getContent(), $webhookSecret);

            if (! hash_equals($expectedSignature, $signature)) {
                Log::warning('Invalid webhook signature');

                return response()->json(['error' => 'Invalid signature'], 400);
            }
        }

        $status = $request->input('data.status');
        $amountInHalalas = $request->input('data.amount');
        $amount = $amountInHalalas / 100;

        $metadata = $request->input('data.metadata');

        // 🟢 الحل السحري: إذا كانت metadata فارغة، نبحث عن الفاتورة لاستخراج البيانات منها
        if (empty($metadata) && $request->has('data.invoice_id')) {
            $invoiceId = $request->input('data.invoice_id');
            $secretKey = config('services.moyasar.secret_key');

            // جلب بيانات الفاتورة الأصلية من ميسر
            $invoiceResponse = Http::withHeaders([
                'Authorization' => 'Basic '.base64_encode($secretKey.':'),
            ])->get("https://api.moyasar.com/v1/invoices/{$invoiceId}");

            if ($invoiceResponse->successful()) {
                $metadata = $invoiceResponse->json('metadata');
                Log::info('Fetched metadata from original invoice:', ['metadata' => $metadata]);
            }
        }

        // التأكد من نجاح العملية ووجود البيانات الصحيحة
        if (
            ($status === 'paid' || $status === 'completed') &&
            is_array($metadata) &&
            isset($metadata['user_id']) &&
            isset($metadata['type']) &&
            $metadata['type'] === 'wallet_topup'
        ) {
            $user = User::find($metadata['user_id']);

            if ($user) {
                try {
                    $this->walletService->processTransaction(
                        $user,
                        $amount,
                        'deposit',
                        'شحن المحفظة عبر ميسر - عملية رقم: '.$request->input('data.id')
                    );

                    Log::info('Wallet topped up successfully', [
                        'user_id' => $user->id,
                        'amount' => $amount,
                    ]);

                    return response()->json(['message' => 'تم شحن المحفظة بنجاح'], 200);

                } catch (\Exception $e) {
                    Log::error('فشل في تحديث المحفظة: '.$e->getMessage());

                    return response()->json(['error' => 'خطأ داخلي في السيرفر'], 500);
                }
            }
        }

        Log::info('Webhook ignored - invalid status or missing data', [
            'status' => $status,
            'has_metadata' => is_array($metadata),
            'metadata' => $metadata,
        ]);

        return response()->json(['message' => 'تم تجاهل الطلب أو الحالة غير صالحة'], 400);
    }
}
