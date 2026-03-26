<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    /**
     * تسجيل مستخدم جديد (بوابة الدخول الموحدة للجميع)
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        // 1. إنشاء المستخدم الأساسي
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'is_active' => true,
        ]);

        // 2. تعيين الصلاحية (teacher, student, parent)
        $user->assignRole($request->role);

        // 3. إنشاء محفظة مالية فارغة فوراً
        $user->wallet()->create(['balance' => 0.00]);

        // 4. توليد التوكن
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'تم إنشاء الحساب بنجاح! مرحباً بك في منصة تاج.',
            'data' => [
                'user' => $user->load('roles', 'wallet'),
                'token' => $token
            ]
        ], 201);
    }

    /**
     * تسجيل الدخول المركزي
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'تم إيقاف حسابك مؤقتاً. يرجى التواصل مع فريق الدعم.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'تم تسجيل الدخول بنجاح.',
            'data' => [
                'user' => $user->load(['roles', 'studentProfile', 'teacherProfile', 'wallet']),
                'token' => $token
            ]
        ]);
    }

    /**
     * جلب بيانات المستخدم الحالي
     */
    public function me(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        return response()->json([
            'status' => 'success',
            'data' => $user->load(['roles', 'studentProfile', 'teacherProfile', 'wallet'])
        ]);
    }

    /**
     * تسجيل الخروج
     */
    public function logout(Request $request)
    {
        /** @var \Laravel\Sanctum\PersonalAccessToken $token */
        $token = $request->user()->currentAccessToken();
        
        if ($token) {
            $token->delete();
        }

        return response()->json(['message' => 'تم تسجيل الخروج بنجاح.']);
    }
}