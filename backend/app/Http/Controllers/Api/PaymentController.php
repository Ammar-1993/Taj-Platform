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
        // Handle different possible payload structures from Moyasar
        $eventType = $request->input('type') ?: $request->input('event_type');
        $paymentData = $request->input('data') ?: $request->all();

        $status = $paymentData['status'] ?? null;
        $amountInHalalas = $paymentData['amount'] ?? 0;
        $amount = $amountInHalalas / 100; // تحويل الهللات إلى ريالات
        $paymentId = $paymentData['id'] ?? null;

        // الـ metadata هي بيانات نرسلها نحن وقت الدفع ليردها لنا البنك لنعرف من هو الدافع
        $metadata = $paymentData['metadata'] ?? [];

        Log::info('Webhook parsed data:', [
            'event_type' => $eventType,
            'status' => $status,
            'amount' => $amount,
            'payment_id' => $paymentId,
            'metadata' => $metadata,
            'full_payload' => $request->all()
        ]);

        // 3. التأكد من نجاح العملية ووجود رقم المستخدم
        // Moyasar sends different status values, check for successful payment statuses
        $successfulStatuses = ['paid', 'completed', 'captured', 'successful'];

        if (in_array($status, $successfulStatuses) && isset($metadata['user_id']) && ($metadata['type'] ?? null) === 'wallet_topup' && $paymentId) {
            $user = User::find($metadata['user_id']);

            if ($user) {
                // Check for duplicate processing
                $existingTransaction = \App\Models\WalletTransaction::where('description', 'LIKE', '%عملية رقم: ' . $paymentId . '%')
                    ->where('wallet_id', $user->wallet->id)
                    ->first();

                if ($existingTransaction) {
                    Log::info('Payment already processed, skipping duplicate', [
                        'payment_id' => $paymentId,
                        'existing_transaction_id' => $existingTransaction->id
                    ]);
                    return response()->json(['message' => 'تمت معالجة هذه العملية مسبقاً'], 200);
                }

                try {
                    // 🚀 استدعاء المحرك المالي الجبار لشحن المحفظة
                    $this->walletService->processTransaction(
                        $user,
                        $amount,
                        'deposit', // إيداع
                        'شحن المحفظة عبر البطاقة البنكية - عملية رقم: ' . $paymentId
                    );

                    Log::info('Wallet topped up successfully', [
                        'user_id' => $user->id,
                        'amount' => $amount,
                        'payment_id' => $paymentId
                    ]);

                    return response()->json(['message' => 'تم شحن المحفظة بنجاح'], 200);

                } catch (\Exception $e) {
                    Log::error('فشل في تحديث المحفظة: ' . $e->getMessage());
                    return response()->json(['error' => 'خطأ داخلي في السيرفر'], 500);
                }
            } else {
                Log::warning('User not found for webhook', ['user_id' => $metadata['user_id']]);
            }
        }

        // إذا كانت العملية مرفوضة أو البيانات ناقصة
        Log::info('Webhook ignored - invalid status or missing data', [
            'event_type' => $eventType,
            'status' => $status,
            'successful_statuses' => $successfulStatuses,
            'has_user_id' => isset($metadata['user_id']),
            'type' => $metadata['type'] ?? null,
            'has_payment_id' => !empty($paymentId)
        ]);

        return response()->json(['message' => 'تم تجاهل الطلب أو الحالة غير صالحة'], 400);
    }
}