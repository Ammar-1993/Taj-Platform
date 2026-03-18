<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\WalletService;
use App\Models\PayoutRequest;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
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
    public function requestPayout(Request $request, \App\Services\WalletService $walletService): \Illuminate\Http\JsonResponse
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

        if (!$user->hasRole('teacher')) {
            return response()->json(['message' => 'هذه الخدمة متاحة للمعلمين فقط'], 403);
        }

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($user, $request, $walletService) {
                // نقفل السجل لمنع تكرار الطلب في نفس اللحظة
                $wallet = $user->wallet()->lockForUpdate()->first();

                if (!$wallet || $wallet->balance < $request->amount) {
                    throw new \Exception('رصيدك الحالي غير كافٍ لسحب هذا المبلغ.');
                }

                // 1. إنشاء طلب السحب (حالة معلق)
                $payout = \App\Models\PayoutRequest::create([
                    'user_id' => $user->id,
                    'amount' => $request->amount,
                    'bank_name' => $request->bank_name,
                    'iban' => $request->iban, // سيتم تشفيره آلياً بفضل الـ Casts
                    'status' => 'pending'
                ]);

                // 2. تجميد (خصم) المبلغ من المحفظة حتى توافق الإدارة
                $walletService->processTransaction(
                    $user,
                    -$request->amount,
                    'withdrawal',
                    'تجميد رصيد لطلب سحب أرباح رقم #' . $payout->id
                );

                return response()->json([
                    'status' => 'success',
                    'message' => 'تم إرسال طلب السحب للإدارة بنجاح!',
                    'data' => $payout
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
