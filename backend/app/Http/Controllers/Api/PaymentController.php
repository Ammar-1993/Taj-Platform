<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\WalletService;
use App\Models\User;
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
            'amount' => 'required|numeric|min:10|max:5000', // 10-5000 SAR
        ]);

        $amount = $request->input('amount');
        $user = $request->user();

        // Convert amount to halalas (Moyasar expects amount in smallest currency unit)
        $amountInHalalas = $amount * 100;

        try {
            // Create payment session with Moyasar
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Basic ' . base64_encode(config('services.moyasar.secret_key') . ':'),
                'Content-Type' => 'application/json',
            ])->post('https://api.moyasar.com/v1/payments', [
                        'amount' => $amountInHalalas,
                        'currency' => 'SAR',
                        'description' => 'شحن المحفظة - ' . $user->name,
                        'callback_url' => 'https://taj-platform.vercel.app/dashboard/top-up/success',
                        'source' => [
                            'type' => 'creditcard',
                        ],
                        'metadata' => [
                            'user_id' => $user->id,
                            'type' => 'wallet_topup',
                        ],
                    ]);

            if ($response->successful()) {
                $paymentData = $response->json();

                return response()->json([
                    'payment_id' => $paymentData['id'],
                    'checkout_url' => $paymentData['source']['transaction_url'] ?? null,
                    'amount' => $amount,
                    'status' => $paymentData['status'],
                ]);
            } else {
                Log::error('Moyasar payment creation failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                // 🟢 هنا التعديل السحري: كشفنا محتوى رسالة ميسر الحقيقية ورابط العودة الذي تم إرساله
                return response()->json([
                    'error' => 'فشل في إنشاء جلسة الدفع',
                    'moyasar_error_details' => $response->json(), // ماذا قالت ميسر بالضبط؟
                    'debug_callback_url' => config('app.url') . '/dashboard/top-up/success', // هل رابطك المرسل صحيح؟
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Payment session creation error: ' . $e->getMessage());

            return response()->json([
                'error' => 'خطأ في الاتصال ببوابة الدفع',
                'exception_details' => $e->getMessage() // 🟢 كشف سبب سقوط السيرفر إن حدث
            ], 500);
        }
    }

    // هذا المسار سيتم استدعاؤه آلياً من خوادم بوابة الدفع (مثل ميسر)
    public function webhook(Request $request)
    {
        // 1. توثيق العملية في ملفات الـ Log للرجوع إليها محاسبياً
        Log::info('Payment Webhook Received:', $request->all());

        // في بيئة الإنتاج الحقيقية: يجب هنا التحقق من التوقيع (Signature)
        // للتأكد من أن الطلب قادم فعلاً من بوابة الدفع وليس من مخترق.
        $signature = $request->header('X-Moyasar-Signature');
        $webhookSecret = config('services.moyasar.webhook_secret');

        if ($webhookSecret && $signature) {
            // Verify webhook signature for production security
            $expectedSignature = hash_hmac('sha256', $request->getContent(), $webhookSecret);

            if (!hash_equals($expectedSignature, $signature)) {
                Log::warning('Invalid webhook signature');
                return response()->json(['error' => 'Invalid signature'], 400);
            }
        }

        // 2. استخراج البيانات (بوابات الدفع غالباً ترسل المبالغ بالهللة/السنت)
        $status = $request->input('data.status'); // حالة الدفع
        $amountInHalalas = $request->input('data.amount');
        $amount = $amountInHalalas / 100; // تحويل الهللات إلى ريالات

        // الـ metadata هي بيانات نرسلها نحن وقت الدفع ليردها لنا البنك لنعرف من هو الدافع
        $metadata = $request->input('data.metadata');

        // 3. التأكد من نجاح العملية ووجود رقم المستخدم
        if ($status === 'paid' && isset($metadata['user_id']) && $metadata['type'] === 'wallet_topup') {
            $user = User::find($metadata['user_id']);

            if ($user) {
                try {
                    // 🚀 استدعاء المحرك المالي الجبار لشحن المحفظة
                    $this->walletService->processTransaction(
                        $user,
                        $amount,
                        'deposit', // إيداع
                        'شحن المحفظة عبر البطاقة البنكية - عملية رقم: ' . $request->input('data.id')
                    );

                    Log::info('Wallet topped up successfully', [
                        'user_id' => $user->id,
                        'amount' => $amount,
                        'payment_id' => $request->input('data.id')
                    ]);

                    return response()->json(['message' => 'تم شحن المحفظة بنجاح'], 200);

                } catch (\Exception $e) {
                    Log::error('فشل في تحديث المحفظة: ' . $e->getMessage());
                    return response()->json(['error' => 'خطأ داخلي في السيرفر'], 500);
                }
            }
        }

        // إذا كانت العملية مرفوضة أو البيانات ناقصة
        Log::info('Webhook ignored - invalid status or missing data', [
            'status' => $status,
            'has_user_id' => isset($metadata['user_id']),
            'type' => $metadata['type'] ?? null
        ]);

        return response()->json(['message' => 'تم تجاهل الطلب أو الحالة غير صالحة'], 400);
    }
}