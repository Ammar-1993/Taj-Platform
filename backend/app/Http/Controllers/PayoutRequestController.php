<?php

namespace App\Http\Controllers;

use App\Models\PayoutRequest;
use App\Services\PayoutService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PayoutRequestController extends Controller
{
    protected PayoutService $payoutService;

    public function __construct(PayoutService $payoutService)
    {
        $this->payoutService = $payoutService;
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

        try {
            $payout = $this->payoutService->requestPayout(
                $user,
                (float) $request->amount,
                $request->bank_name,
                $request->iban
            );

            return response()->json([
                'status' => 'success',
                'message' => 'تم رفع طلب السحب بنجاح. سيتم مراجعته وتحويل المبلغ قريباً.',
                'data' => $payout
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 400); // Badrequest for logic failure
        }
    }

    // يمكننا إبقاء باقي الدوال فارغة أو حذفها إذا لم نكن نحتاجها في واجهة المعلم
    public function show(PayoutRequest $payoutRequest) {}
    public function update(Request $request, PayoutRequest $payoutRequest) {}
    public function destroy(PayoutRequest $payoutRequest) {}
}