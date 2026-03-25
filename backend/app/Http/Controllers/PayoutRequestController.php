<?php

namespace App\Http\Controllers;

use App\Models\PayoutRequest;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PayoutRequestController extends Controller
{
    protected WalletService $walletService;

    // حقن خدمة المحفظة للتعامل مع الرصيد
    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    /**
     * جلب سجل طلبات السحب الخاصة بالمعلم
     */
    public function index(Request $request): JsonResponse
    {
        // جلب الطلبات مرتبة من الأحدث للأقدم
        $payouts = PayoutRequest::where('user_id', $request->user()->id)->latest()->get();
        
        return response()->json([
            'status' => 'success', 
            'data' => $payouts
        ]);
    }

    /**
     * تقديم طلب سحب جديد وتجميد الرصيد
     */
    public function store(Request $request): JsonResponse
    {
        // 1. التحقق من صحة المدخلات
        $request->validate([
            'amount' => 'required|numeric|min:50', // الحد الأدنى 50
            'bank_name' => 'required|string|max:255',
            'iban' => 'required|string|min:15|max:34',
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        // 2. التحقق من الرصيد المتاح (Security Check)
        if ($user->wallet->balance < $request->amount) {
            return response()->json([
                'message' => 'رصيدك الحالي غير كافٍ لإتمام هذا الطلب.'
            ], 400);
        }

        try {
            DB::beginTransaction();

            // 3. خصم (تجميد) المبلغ من المحفظة فوراً لمنع السحب المزدوج
            $this->walletService->processTransaction(
                $user,
                -$request->amount,
                'withdrawal',
                'تجميد رصيد لطلب سحب أرباح (قيد المراجعة الإدارية)'
            );

            // 4. إنشاء الطلب (Laravel سيقوم بتشفير الـ IBAN تلقائياً بفضل الـ Cast الخاص بك)
            $payout = PayoutRequest::create([
                'user_id' => $user->id,
                'amount' => $request->amount,
                'bank_name' => $request->bank_name,
                'iban' => $request->iban,
                'status' => 'pending'
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'تم رفع طلب السحب بنجاح. سيتم مراجعته وتحويل المبلغ قريباً.',
                'data' => $payout
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'حدث خطأ غير متوقع أثناء معالجة الطلب.'
            ], 500);
        }
    }

    // يمكننا إبقاء باقي الدوال فارغة أو حذفها إذا لم نكن نحتاجها في واجهة المعلم
    public function show(PayoutRequest $payoutRequest) {}
    public function update(Request $request, PayoutRequest $payoutRequest) {}
    public function destroy(PayoutRequest $payoutRequest) {}
}