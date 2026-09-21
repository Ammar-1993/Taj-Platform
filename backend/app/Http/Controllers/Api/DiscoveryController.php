<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GradeLevel;
use App\Models\Review;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DiscoveryController extends Controller
{
    // 1. جلب المواد الدراسية الفعالة (Cached: 24 Hours)
    public function subjects(): JsonResponse
    {
        $gradeLevelId = null;

        // فلترة المواد بناءً على المرحلة الدراسية للطالب المسجل الدخول
        if (auth('sanctum')->check()) {
            /** @var User $user */
            $user = auth('sanctum')->user();
            if ($user->hasRole('student')) {
                $user->load('studentProfile');
                if ($user->studentProfile && $user->studentProfile->grade_level_id) {
                    $gradeLevelId = $user->studentProfile->grade_level_id;
                }
            }
        }

        $cacheKey = 'catalog:subjects:'.($gradeLevelId ? "grade_{$gradeLevelId}" : 'all');

        $queryCallback = function () use ($gradeLevelId) {
            $query = Subject::where('is_active', true);
            if ($gradeLevelId) {
                $query->where('grade_level_id', $gradeLevelId);
            }

            return $query->get();
        };

        $subjects = Cache::supportsTags()
            ? Cache::tags(['catalog', 'subjects'])->remember($cacheKey, now()->addDay(), $queryCallback)
            : Cache::remember($cacheKey, now()->addDay(), $queryCallback);

        return response()->json(['status' => 'success', 'data' => $subjects]);
    }

    // 2. جلب المراحل الدراسية وأسعارها (Cached: 24 Hours)
    public function gradeLevels(): JsonResponse
    {
        $queryCallback = fn () => GradeLevel::where('is_active', true)->get();

        $grades = Cache::supportsTags()
            ? Cache::tags(['catalog', 'grade_levels'])->remember('catalog:grade_levels:active', now()->addDay(), $queryCallback)
            : Cache::remember('catalog:grade_levels:active', now()->addDay(), $queryCallback);

        return response()->json(['status' => 'success', 'data' => $grades]);
    }

    // 3. محرك بحث المعلمين (مع الفلاتر والترتيب) (Cached: 10 Minutes with Query Fingerprinting)
    public function teachers(Request $request): JsonResponse
    {
        $gradeLevelId = null;
        if (auth('sanctum')->check()) {
            /** @var User $user */
            $user = auth('sanctum')->user();
            if ($user->hasRole('student')) {
                $user->load('studentProfile');
                if ($user->studentProfile && $user->studentProfile->grade_level_id) {
                    $gradeLevelId = $user->studentProfile->grade_level_id;
                }
            }
        }

        $cacheParams = [
            'page' => (int) $request->get('page', 1),
            'subject_id' => $request->get('subject_id'),
            'search' => trim((string) $request->get('search')),
            'sort_by' => $request->get('sort_by'),
            'grade_level_id' => $gradeLevelId,
        ];
        $cacheKey = 'teachers:search:'.md5(json_encode($cacheParams));

        $queryCallback = function () use ($request, $gradeLevelId) {
            // 🟢 تحديد select('users.*') مهم جداً لتجنب تداخل حقل الـ id عند استخدام join لاحقاً
            $query = User::select('users.*')
                ->role('teacher')
                ->where('users.is_active', true)
                ->with(['teacherProfile.subject']) // Eager Loading لتسريع الاستعلام
                ->withCount(['teacherSlots as active_slots_count' => function ($q) {
                    $q->where('status', 'available')
                        ->where('slot_date', '>=', now()->toDateString());
                }])
                ->whereHas('teacherProfile', function ($q) {
                    $q->where('is_verified', true); // نجلب المعلمين الموثقين فقط
                });

            // فلترة المعلمين بناءً على المرحلة الدراسية للطالب المسجل الدخول
            if ($gradeLevelId) {
                $query->whereHas('teacherProfile.subject', function ($q) use ($gradeLevelId) {
                    $q->where('grade_level_id', $gradeLevelId);
                });
            }

            // فلتر حسب المادة
            if ($request->has('subject_id') && $request->subject_id != '') {
                $query->whereHas('teacherProfile', function ($q) use ($request) {
                    $q->where('subject_id', $request->subject_id);
                });
            }

            // فلتر البحث بالاسم
            if ($request->has('search') && $request->search != '') {
                $query->where('users.name', 'like', '%'.$request->search.'%');
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
            return $query->paginate(15);
        };

        $teachers = Cache::supportsTags()
            ? Cache::tags(['teachers', 'discovery'])->remember($cacheKey, now()->addMinutes(10), $queryCallback)
            : Cache::remember($cacheKey, now()->addMinutes(10), $queryCallback);

        return response()->json(['status' => 'success', 'data' => $teachers]);
    }

    // 4. جلب الأوقات المتاحة لمعلم محدد (Cached: 15 Minutes)
    public function teacherSlots(int $teacherId): JsonResponse
    {
        $today = now()->toDateString();
        $cacheKey = "teacher:{$teacherId}:slots:{$today}";

        $queryCallback = function () use ($teacherId, $today) {
            $teacher = User::role('teacher')
                ->with(['teacherProfile.subject'])
                ->findOrFail($teacherId);

            $slots = $teacher->teacherSlots()
                ->where('status', 'available')
                ->where('slot_date', '>=', $today) // أوقات اليوم والمستقبل فقط
                ->orderBy('slot_date')
                ->orderBy('start_time')
                ->get()
                // تجميع الأوقات حسب اليوم لسهولة عرضها في الواجهة الأمامية
                ->groupBy('slot_date');

            return [
                'teacher_name' => $teacher->name,
                'teacher' => $teacher,
                'data' => $slots,
            ];
        };

        $payload = Cache::supportsTags()
            ? Cache::tags(["teacher_{$teacherId}", 'slots'])->remember($cacheKey, now()->addMinutes(15), $queryCallback)
            : Cache::remember($cacheKey, now()->addMinutes(15), $queryCallback);

        return response()->json(array_merge(['status' => 'success'], $payload));
    }

    // 5. جلب تقييمات المعلم (Cached: 30 Minutes)
    public function teacherReviews(int $teacherId, Request $request): JsonResponse
    {
        $page = (int) $request->get('page', 1);
        $cacheKey = "teacher:{$teacherId}:reviews:page_{$page}";

        $queryCallback = function () use ($teacherId) {
            User::role('teacher')->findOrFail($teacherId);

            return Review::where('teacher_id', $teacherId)
                ->with('student:id,name')
                ->latest()
                ->paginate(10);
        };

        $reviews = Cache::supportsTags()
            ? Cache::tags(["teacher_{$teacherId}", 'reviews'])->remember($cacheKey, now()->addMinutes(30), $queryCallback)
            : Cache::remember($cacheKey, now()->addMinutes(30), $queryCallback);

        return response()->json([
            'status' => 'success',
            'data' => $reviews,
        ]);
    }
}
