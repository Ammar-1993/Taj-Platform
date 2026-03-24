<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Review;
use App\Models\TeacherProfile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        // 1. التأكد من أن الحجز يخص هذا الطالب وأنه مكتمل
        $booking = Booking::where('id', $request->booking_id)
            ->where(function ($q) use ($user) {
                $q->where('student_id', $user->id)->orWhere('booked_by_id', $user->id);
            })->firstOrFail();

        if ($booking->status !== 'completed') {
            return response()->json(['message' => 'لا يمكن تقييم حصة لم تكتمل بعد.'], 400);
        }

        if ($booking->review()->exists()) {
            return response()->json(['message' => 'لقد قمت بتقييم هذه الحصة مسبقاً.'], 400);
        }

        try {
            DB::beginTransaction();

            // 2. إنشاء التقييم
            $review = Review::create([
                'booking_id' => $booking->id,
                'student_id' => $booking->student_id,
                'teacher_id' => $booking->teacher_id,
                'rating' => $request->rating,
                'comment' => $request->comment,
                'is_published' => true, // يمكن جعلها false إذا أردنا مراجعة الإدارة أولاً
            ]);

            // 3. تحديث متوسط تقييم المعلم (المعادلة الرياضية)
            $profile = TeacherProfile::where('user_id', $booking->teacher_id)->lockForUpdate()->first();
            
            if ($profile) {
                $oldCount = $profile->reviews_count;
                $oldAvg = $profile->average_rating;
                
                $newCount = $oldCount + 1;
                // حساب المتوسط الجديد بدقة
                $newAvg = (($oldAvg * $oldCount) + $request->rating) / $newCount;

                $profile->update([
                    'reviews_count' => $newCount,
                    'average_rating' => round($newAvg, 2)
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'تم حفظ التقييم بنجاح، شكراً لك!',
                'data' => $review
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'حدث خطأ أثناء حفظ التقييم'], 500);
        }
    }
}