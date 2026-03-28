<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\WalletService;
use App\Models\PayoutRequest;
use Illuminate\Support\Facades\DB;

use App\Services\PayoutService;
use Exception;

class WalletController extends Controller
{
    protected PayoutService $payoutService;

    public function __construct(PayoutService $payoutService)
    {
        $this->payoutService = $payoutService;
    }
    // جلب الرصيد وكشف الحساب
    public function index(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        // جلب المحفظة، أو إنشاؤها إن لم تكن موجودة
        $wallet = $user->wallet()->firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0.00]
        );

        // جلب العمليات المالية (كشف الحساب) مع الفلترة
        $query = $wallet->transactions()->with('booking');

        if ($request->has('type')) {
            $query->where('type', $request->type); // withdrawal, class_earnings, etc.
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => [
                'balance' => $wallet->balance,
                'transactions' => $transactions,
            ],
        ]);
    }


    // طلب سحب أرباح (للمعلمين)
    public function requestPayout(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:50', // الحد الأدنى للسحب 50 ريال
            'bank_name' => 'required|string|max:255',
            'iban' => 'required|string|starts_with:SA', // يجب أن يبدأ بـ SA
        ], [
            'amount.min' => 'الحد الأدنى لسحب الأرباح هو 50 ريال.',
            'iban.starts_with' => 'رقم الآيبان يجب أن يبدأ بـ SA.'
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
                'message' => 'تم إرسال طلب السحب للإدارة بنجاح!',
                'data' => $payout
            ]);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
