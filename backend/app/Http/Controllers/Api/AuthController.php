<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Notification;
use App\Notifications\PasswordChanged;

class AuthController extends Controller
{
    /**
     * تسجيل مستخدم جديد (بوابة الدخول الموحدة للجميع)
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        // 1. إنشاء المستخدم الأساسي
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password' => Hash::make($data['password']),
            'is_active' => true,
        ]);

        // 2. تعيين الصلاحية (teacher, student, parent)
        $user->assignRole($data['role']);

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
        $data = $request->validated();
        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
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
     * إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $status = Password::sendResetLink($request->only('email'));

        return $status === Password::RESET_LINK_SENT
            ? response()->json([
                'status' => 'success',
                'message' => 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'
            ])
            : response()->json([
                'status' => 'error',
                'message' => __($status),
            ], 500);
    }

    /**
     * إعادة تعيين كلمة المرور باستخدام الرمز المرسل عبر البريد.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json([
                'status' => 'success',
                'message' => 'تم إعادة تعيين كلمة المرور بنجاح.'
            ])
            : response()->json([
                'status' => 'error',
                'message' => __($status),
            ], 400);
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

    /**
     * تحديث بيانات المستخدم
     */
    public function updateUser(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'current_password' => 'required_with:password|string',
            'password' => 'sometimes|string|min:8|confirmed',
            'bio' => 'sometimes|string|max:1000',
            'avatar' => 'sometimes|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // تحديث الاسم إذا تم تقديمه
        if ($request->has('name')) {
            $user->name = $request->name;
        }

        // تحديث كلمة المرور إذا تم تقديمها
        if ($request->has('password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'كلمة المرور الحالية غير صحيحة.'
                ], 400);
            }

            $user->password = Hash::make($request->password);

            // إرسال إشعار بتغيير كلمة المرور
            Notification::send($user, new PasswordChanged());
        }

        // تحديث السيرة الذاتية إذا كان المستخدم معلماً
        if ($request->has('bio') && $user->hasRole('teacher')) {
            $user->teacherProfile()->update(['bio' => $request->bio]);
        }

        // حفظ الصورة الشخصية إذا تم رفعها
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar_url = '/storage/' . $path;
        }

        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'تم تحديث البيانات بنجاح.',
            'data' => $user->load(['roles', 'studentProfile', 'teacherProfile', 'wallet'])
        ]);
    }
}