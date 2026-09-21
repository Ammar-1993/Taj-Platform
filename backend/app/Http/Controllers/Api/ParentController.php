<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Parent\StoreChildRequest;
use App\Http\Requests\Parent\UpdateChildRequest;
use App\Models\Booking;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ParentController extends Controller
{
    // 1. جلب قائمة الأبناء
    public function getChildren(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $children = User::where('parent_id', $user->id)
            ->with('studentProfile.gradeLevel')
            ->get();

        return response()->json(['status' => 'success', 'data' => $children]);
    }

    // 2. إضافة ابن جديد
    public function storeChild(StoreChildRequest $request): JsonResponse
    {
        $user = $request->user();

        try {
            DB::beginTransaction();

            $child = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'parent_id' => $user->id, // تم التعديل هنا لتجاوز تحذير VS Code
                'is_active' => true,
            ]);

            // إعطاء صلاحية طالب للابن
            $child->assignRole('student');

            // إنشاء محفظة للابن (رصيدها صفر)
            $child->wallet()->create(['balance' => 0.00]);

            // إنشاء الملف الشخصي وتحديد المرحلة الدراسية
            $child->studentProfile()->create([
                'grade_level_id' => $request->grade_level_id,
                'can_book_independently' => false, // الأب هو من يحجز له مبدئياً
            ]);

            DB::commit();

            self::clearParentDashboardCache($user->id);

            return response()->json([
                'status' => 'success',
                'message' => 'تم إضافة حساب الابن بنجاح',
                'data' => $child->load('studentProfile.gradeLevel'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['status' => 'error', 'message' => 'حدث خطأ أثناء الإضافة'], 500);
        }
    }

    // 3. تعديل بيانات الابن
    public function updateChild(UpdateChildRequest $request, int $id): JsonResponse
    {
        $user = $request->user();

        // التأكد من أن الابن يتبع لهذا الأب فعلاً (Security Check)
        $child = User::where('parent_id', $user->id)->findOrFail($id);

        $child->update(['name' => $request->name]);

        $child->studentProfile()->update([
            'grade_level_id' => $request->grade_level_id,
        ]);

        self::clearParentDashboardCache($user->id);

        return response()->json([
            'status' => 'success',
            'message' => 'تم تحديث بيانات الابن بنجاح',
            'data' => $child->load('studentProfile.gradeLevel'),
        ]);
    }

    // 4. تفعيل/تعطيل صلاحية الحجز والدفع للابن
    public function toggleBookingPermission(int $id): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        // التأكد من أن الابن يتبع لهذا الأب (Security Check)
        $child = User::where('parent_id', $user->id)->findOrFail($id);
        $profile = $child->studentProfile;

        if ($profile) {
            // عكس الحالة الحالية (إذا كان مفعل يعطله، والعكس)
            $profile->update([
                'can_book_independently' => ! $profile->can_book_independently,
            ]);
        }

        self::clearParentDashboardCache($user->id);

        return response()->json([
            'status' => 'success',
            'message' => 'تم تحديث صلاحية الحجز للابن بنجاح',
            'data' => $child->load('studentProfile.gradeLevel'),
        ]);
    }

    // 5. جلب لوحة المراقبة الشاملة (الحجوزات والسجل المالي للأبناء)
    public function getDashboardData(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        $page = (int) $request->get('page', 1);

        $cacheKey = "parent_dashboard:{$user->id}:page:{$page}";
        $tags = ['parent_dashboard', "parent_{$user->id}"];

        $fetchData = function () use ($user) {
            // 1. جلب معرّفات (IDs) جميع أبناء هذا الولي
            $childrenIds = User::where('parent_id', $user->id)->pluck('id');

            // 2. حساب إجمالي الإنفاق (مجموع المبالغ المدفوعة للحجوزات المكتملة والمجدولة)
            $totalSpent = Booking::whereIn('student_id', $childrenIds)
                ->whereIn('status', ['completed', 'scheduled', 'in_progress'])
                ->sum('net_paid');

            // 3. جلب حجوزات الأبناء (مع بيانات الابن والمعلم) مع التصفح
            $bookings = Booking::whereIn('student_id', $childrenIds)
                ->with([
                    'student:id,name,email',
                    'teacher:id,name,email',
                    'teacherSlot:id,slot_date,start_time,end_time,status',
                    'review:id,booking_id,rating,comment',
                ])
                ->orderBy('created_at', 'desc')
                ->paginate(10);

            // 4. جلب محافظ الأبناء مع آخر العمليات المالية (الفواتير)
            $wallets = Wallet::whereIn('user_id', $childrenIds)
                ->with(['transactions' => function ($query) {
                    $query->orderBy('created_at', 'desc')->limit(10); // آخر 10 عمليات
                }, 'user:id,name'])
                ->get();

            return [
                'total_spent' => $totalSpent,
                'bookings' => $bookings,
                'wallets' => $wallets,
            ];
        };

        $cachedData = Cache::supportsTags()
            ? Cache::tags($tags)->remember($cacheKey, now()->addMinutes(10), $fetchData)
            : Cache::remember($cacheKey, now()->addMinutes(10), $fetchData);

        // التأكد من وجود محفظة للأب وجلب رصيدها الحي دون تخزين مؤقت لتفادي أي تضارب مالي
        $parentWallet = $user->wallet()->firstOrCreate(['user_id' => $user->id], ['balance' => 0.00]);

        return response()->json([
            'status' => 'success',
            'data' => array_merge($cachedData, [
                'parent_balance' => $parentWallet->balance,
            ]),
        ]);
    }

    public static function clearParentDashboardCache(int $parentId): void
    {
        if (Cache::supportsTags()) {
            Cache::tags(["parent_{$parentId}", 'parent_dashboard'])->flush();
        } else {
            Cache::forget("parent_dashboard:{$parentId}:page:1");
        }
    }
}
