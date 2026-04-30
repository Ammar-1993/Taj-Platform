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
            'amount' => 'required|numeric|min:10|max:5000',
        ]);

        $amount = $request->input('amount');
        $user = $request->user();
        $amountInHalalas = $amount * 100;

        try {
            // 🟢 التعديل السحري: نستخدم رابط الفواتير (invoices) بدلاً من (payments)
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Basic ' . base64_encode(config('services.moyasar.secret_key') . ':'),
                'Content-Type' => 'application/json',
            ])->post('https://api.moyasar.com/v1/invoices', [ // <== هنا التغيير الأهم
                'amount' => $amountInHalalas,
                'currency' => 'SAR',
                'description' => 'شحن المحفظة - ' . $user->name,
                
                // 🟢 نظام الفواتير في ميسر يستخدم success_url للنجاح و back_url للإلغاء
                'success_url' => env('FRONTEND_URL') . '/dashboard/top-up/success',
                'back_url' => env('FRONTEND_URL') . '/dashboard/top-up',
                
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
                'exception_details' => $e->getMessage()
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