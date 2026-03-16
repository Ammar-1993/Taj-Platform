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

    // هذا المسار سيتم استدعاؤه آلياً من خوادم بوابة الدفع (مثل ميسر)
    public function webhook(Request $request)
    {
        // 1. توثيق العملية في ملفات الـ Log للرجوع إليها محاسبياً
        Log::info('Payment Webhook Received:', $request->all());

        // في بيئة الإنتاج الحقيقية: يجب هنا التحقق من التوقيع (Signature)
        // للتأكد من أن الطلب قادم فعلاً من بوابة الدفع وليس من مخترق.

        // 2. استخراج البيانات (بوابات الدفع غالباً ترسل المبالغ بالهللة/السنت)
        $status = $request->input('data.status'); // حالة الدفع
        $amountInHalalas = $request->input('data.amount'); 
        $amount = $amountInHalalas / 100; // تحويل الهللات إلى ريالات
        
        // الـ metadata هي بيانات نرسلها نحن وقت الدفع ليردها لنا البنك لنعرف من هو الدافع
        $metadata = $request->input('data.metadata'); 

        // 3. التأكد من نجاح العملية ووجود رقم المستخدم
        if ($status === 'paid' && isset($metadata['user_id'])) {
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

                    return response()->json(['message' => 'تم شحن المحفظة بنجاح'], 200);

                } catch (\Exception $e) {
                    Log::error('فشل في تحديث المحفظة: ' . $e->getMessage());
                    return response()->json(['error' => 'خطأ داخلي في السيرفر'], 500);
                }
            }
        }

        // إذا كانت العملية مرفوضة أو البيانات ناقصة
        return response()->json(['message' => 'تم تجاهل الطلب أو الحالة غير صالحة'], 400);
    }
}