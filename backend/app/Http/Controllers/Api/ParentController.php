<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Parent\StoreChildRequest;
use App\Http\Requests\Parent\UpdateChildRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ParentController extends Controller
{
    // 1. جلب قائمة الأبناء
    public function getChildren(): JsonResponse
    {
        /** @var \App\Models\User $user */
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

            return response()->json([
                'status' => 'success',
                'message' => 'تم إضافة حساب الابن بنجاح',
                'data' => $child->load('studentProfile.gradeLevel')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'حدث خطأ أثناء الإضافة'], 500);
        }
    }

    // 3. تعديل بيانات الابن
    public function updateChild(UpdateChildRequest $request, $id): JsonResponse
    {
        $user = $request->user();

        // التأكد من أن الابن يتبع لهذا الأب فعلاً (Security Check)
        $child = User::where('parent_id', $user->id)->findOrFail($id);

        $child->update(['name' => $request->name]);
        
        $child->studentProfile()->update([
            'grade_level_id' => $request->grade_level_id
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'تم تحديث بيانات الابن بنجاح',
            'data' => $child->load('studentProfile.gradeLevel')
        ]);
    }

    // 4. تفعيل/تعطيل صلاحية الحجز والدفع للابن
    public function toggleBookingPermission($id): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // التأكد من أن الابن يتبع لهذا الأب (Security Check)
        $child = User::where('parent_id', $user->id)->findOrFail($id);
        $profile = $child->studentProfile;

        if ($profile) {
            // عكس الحالة الحالية (إذا كان مفعل يعطله، والعكس)
            $profile->update([
                'can_book_independently' => !$profile->can_book_independently
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'تم تحديث صلاحية الحجز للابن بنجاح',
            'data' => $child->load('studentProfile.gradeLevel')
        ]);
    }
}