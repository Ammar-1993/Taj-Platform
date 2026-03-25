<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TeacherProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    // ==========================================
    // 🟢 1. جلب بيانات الملف الشخصي الحالي للمعلم
    // ==========================================
    public function getTeacherProfile(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        // جلب الملف مع علاقة المادة لتعبئة نموذج التعديل في الواجهة الأمامية
        $profile = TeacherProfile::with('subject')->where('user_id', $user->id)->first();
        
        return response()->json([
            'status' => 'success',
            'data' => $profile
        ]);
    }

    // ==========================================
    // 🟢 2. استكمال بيانات المعلم ورفع المستندات (الكود المحدث)
    // ==========================================
    public function completeTeacherProfile(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $user->hasRole('teacher')) {
            return response()->json(['message' => 'غير مصرح لك بإجراء هذه العملية.'], 403);
        }

        // التحقق من صحة البيانات وحجم ونوع الملفات لحماية السيرفر
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'bio' => 'required|string|min:10|max:1000',
            'national_id' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120', // الحد الأقصى 5 ميجا
            'degree' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        // جلب الملف الشخصي إن وجد، أو تحضير سجل جديد
        $profile = TeacherProfile::firstOrNew(['user_id' => $user->id]);
        $profile->subject_id = $request->subject_id;
        $profile->bio = $request->bio;
        // نجعله false بمجرد التعديل/الرفع حتى توافق عليه الإدارة مجدداً
        $profile->is_verified = false; 

        // معالجة رفع الهوية الوطنية بأمان
        if ($request->hasFile('national_id')) {
            // حذف الملف القديم إن وجد لتوفير مساحة التخزين
            if ($profile->national_id_path) {
                Storage::disk('public')->delete($profile->national_id_path);
            }
            // حفظ الملف الجديد وإرجاع مساره
            $profile->national_id_path = $request->file('national_id')->store('teacher_documents', 'public');
        }

        // معالجة رفع الشهادة
        if ($request->hasFile('degree')) {
            if ($profile->degree_path) {
                Storage::disk('public')->delete($profile->degree_path);
            }
            $profile->degree_path = $request->file('degree')->store('teacher_documents', 'public');
        }

        $profile->save();

        return response()->json([
            'status' => 'success',
            'message' => 'تم استكمال ملف المعلم ورفع المستندات بنجاح. حسابك الآن قيد المراجعة الإدارية ⏳',
            'data' => $profile,
        ]);
    }

    // ==========================================
    // 🔵 3. استكمال بيانات الطالب (الكود القديم الخاص بك كما هو)
    // ==========================================
    public function completeStudentProfile(Request $request): JsonResponse
    {
        $request->validate([
            'grade_level_id' => 'required|exists:grade_levels,id',
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $user->hasRole('student')) {
            return response()->json(['message' => 'غير مصرح لك.'], 403);
        }

        $profile = $user->studentProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'grade_level_id' => $request->grade_level_id,
                'can_book_independently' => true,
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'تم استكمال ملف الطالب بنجاح',
            'data' => $profile,
        ]);
    }
}