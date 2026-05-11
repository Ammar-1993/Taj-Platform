<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TeacherSlot;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherSlotController extends Controller
{
    // 1. جلب جميع مواعيد المعلم (المستقبلية)
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $slots = TeacherSlot::where('teacher_id', $user->id)
            ->where('slot_date', '>=', now()->toDateString()) // جلب مواعيد اليوم والمستقبل فقط
            ->orderBy('slot_date')
            ->orderBy('start_time')
            ->get()
            ->groupBy('slot_date'); // تجميعها حسب اليوم لتسهيل عرضها في الواجهة

        return response()->json([
            'status' => 'success',
            'data' => $slots,
        ]);
    }

    // 2. إضافة موعد متاح جديد
    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $request->validate([
            'slot_date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ], [
            'end_time.after' => 'يجب أن يكون وقت النهاية بعد وقت البداية.',
            'slot_date.after_or_equal' => 'لا يمكنك إضافة مواعيد في الماضي.',
        ]);

        // 🛡️ التحقق من التضارب الزمني (Time Overlap Security Check)
        $overlappingSlot = TeacherSlot::where('teacher_id', $user->id)
            ->where('slot_date', $request->slot_date)
            ->where(function ($query) use ($request) {
                // خوارزمية التداخل: إذا بدأ موعد جديد قبل نهاية الموعد القديم، وانتهى بعد بداية الموعد القديم
                $query->where('start_time', '<', $request->end_time)
                    ->where('end_time', '>', $request->start_time);
            })
            ->first();

        if ($overlappingSlot) {
            return response()->json([
                'status' => 'error',
                'message' => 'يوجد تضارب زمني! لديك موعد آخر في هذا الوقت يبدأ الساعة '.substr($overlappingSlot->start_time, 0, 5),
            ], 422);
        }

        // إنشاء الموعد
        $slot = TeacherSlot::create([
            'teacher_id' => $user->id,
            'slot_date' => $request->slot_date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'status' => 'available',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'تم إضافة الموعد بنجاح!',
            'data' => $slot,
        ], 201);
    }

    // 3. حذف موعد (فقط إذا لم يتم حجزه بعد)
    public function destroy(Request $request, $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $slot = TeacherSlot::where('teacher_id', $user->id)->findOrFail($id);

        // حماية: لا يمكن حذف موعد محجوز أو منتهي
        if ($slot->status !== 'available') {
            return response()->json([
                'status' => 'error',
                'message' => 'لا يمكن حذف هذا الموعد لأنه '.($slot->status === 'booked' ? 'محجوز من قبل طالب' : 'غير متاح').'.',
            ], 403);
        }

        $slot->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'تم حذف الموعد بنجاح.',
        ]);
    }
}
