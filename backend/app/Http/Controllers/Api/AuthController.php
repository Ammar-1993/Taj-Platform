<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // 1. تسجيل مستخدم جديد
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password), // التشفير
            'is_active' => true,
        ]);

        // تعيين الصلاحية (طالب، معلم، أب)
        $user->assignRole($request->role);

        // إنشاء محفظة مالية فارغة للمستخدم فور تسجيله
        $user->wallet()->create(['balance' => 0.00]);

        // توليد التوكن
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'تم إنشاء الحساب بنجاح',
            'data' => [
                'user' => $user->load('roles'),
                'token' => $token
            ]
        ], 201);
    }

    // 2. تسجيل الدخول
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'بيانات الدخول غير صحيحة.'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'حسابك موقوف، يرجى التواصل مع الإدارة.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'تم تسجيل الدخول بنجاح',
            'data' => [
                'user' => $user->load('roles', 'studentProfile', 'teacherProfile', 'wallet'),
                'token' => $token
            ]
        ]);
    }

    // 3. جلب بيانات المستخدم الحالي
    public function me(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        return response()->json([
            'status' => 'success',
            'data' => $user->load('roles', 'studentProfile', 'teacherProfile', 'wallet')
        ]);
    }

    // 4. تسجيل الخروج (إلغاء التوكن)
    public function logout(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        
        $user->tokens()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'تم تسجيل الخروج بنجاح'
        ]);
    }
}