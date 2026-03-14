<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
                'transactions' => $transactions
            ]
        ]);
    }
}