<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradeLevel;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DiscoveryController extends Controller
{
    // 1. جلب المواد الدراسية الفعالة
    public function subjects(): JsonResponse
    {
        $subjects = Subject::where('is_active', true)->get();
        return response()->json(['status' => 'success', 'data' => $subjects]);
    }

    // 2. جلب المراحل الدراسية وأسعارها
    public function gradeLevels(): JsonResponse
    {
        $grades = GradeLevel::where('is_active', true)->get();
        return response()->json(['status' => 'success', 'data' => $grades]);
    }

    // 3. محرك بحث المعلمين (مع الفلاتر والترتيب)
    public function teachers(Request $request): JsonResponse
    {
        // 🟢 تحديد select('users.*') مهم جداً لتجنب تداخل حقل الـ id عند استخدام join لاحقاً
        $query = User::select('users.*')
            ->role('teacher')
            ->where('users.is_active', true)
            ->with(['teacherProfile.subject']) // Eager Loading لتسريع الاستعلام
            ->whereHas('teacherProfile', function ($q) {
                $q->where('is_verified', true); // نجلب المعلمين الموثقين فقط
            });

        // فلتر حسب المادة
        if ($request->has('subject_id') && $request->subject_id != '') {
            $query->whereHas('teacherProfile', function ($q) use ($request) {
                $q->where('subject_id', $request->subject_id);
            });
        }

        // فلتر البحث بالاسم
        if ($request->has('search') && $request->search != '') {
            $query->where('users.name', 'like', '%' . $request->search . '%');
        }

        // 🟢 التحديث الجديد: الفلترة والترتيب حسب التقييم
        if ($request->has('sort_by') && $request->sort_by === 'rating_desc') {
            // نربط جدول الملف الشخصي لكي نتمكن من الترتيب بناءً على عمود average_rating
            $query->join('teacher_profiles', 'users.id', '=', 'teacher_profiles.user_id')
                  ->orderBy('teacher_profiles.average_rating', 'desc');
        } else {
            // الترتيب الافتراضي (الأحدث تسجيلاً أولاً)
            $query->latest('users.created_at');
        }

        // نستخدم التصفح (Pagination) لكي لا ينهار السيرفر إذا كان لدينا 1000 معلم
        $teachers = $query->paginate(15);

        return response()->json(['status' => 'success', 'data' => $teachers]);
    }

    // 4. جلب الأوقات المتاحة لمعلم محدد
    public function teacherSlots($teacherId): JsonResponse
    {
        $teacher = User::role('teacher')->findOrFail($teacherId);

        $slots = $teacher->teacherSlots()
            ->where('status', 'available')
            ->where('slot_date', '>=', now()->toDateString()) // أوقات اليوم والمستقبل فقط
            ->orderBy('slot_date')
            ->orderBy('start_time')
            ->get()
            // تجميع الأوقات حسب اليوم لسهولة عرضها في الواجهة الأمامية
            ->groupBy('slot_date'); 

        return response()->json([
            'status' => 'success', 
            'teacher_name' => $teacher->name,
            'data' => $slots
        ]);
    }
}