<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\StoreBookingRequest;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class BookingController extends Controller
{
    protected BookingService $bookingService;

    public function __construct(BookingService $bookingService)
    {
        $this->bookingService = $bookingService;
    }

    // 1. إنشاء حجز جديد (تنفيذ الدفع والحجز)
    public function store(StoreBookingRequest $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        
        // تحديد من هو الطالب الفعلي (إذا كان الأب يحجز لابنه، أم الطالب يحجز لنفسه)
        $student = $request->has('parent_student_id') && $user->hasRole('parent')
            ? \App\Models\User::findOrFail($request->parent_student_id)
            : $user;

        try {
            // 🚀 استدعاء المحرك الهندسي الجبار
            $booking = $this->bookingService->createBooking(
                $student,
                $request->teacher_slot_id,
                $request->promo_code,
                $user->id // booked_by_id
            );

            // تحميل بيانات المعلم والموعد لعرضها كفاتورة استجابة
            $booking->load(['teacher', 'teacherSlot']);

            return response()->json([
                'status' => 'success',
                'message' => 'تم تأكيد الحجز وخصم المبلغ بنجاح!',
                'data' => $booking
            ], 201);

        } catch (Exception $e) {
            // التقاط أي خطأ (رصيد غير كافٍ، موعد محجوز مسبقاً) وإرجاعه بأمان
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    // 2. جلب قائمة حجوزاتي (للطالب أو المعلم)
    public function index(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $query = \App\Models\Booking::with(['teacher', 'student', 'teacherSlot', 'review']);

        if ($user->hasRole('teacher')) {
            $query->where('teacher_id', $user->id);
        } else {
            $query->where('student_id', $user->id)->orWhere('booked_by_id', $user->id);
        }

        // إمكانية الفلترة حسب الحالة (مثال: ?status=scheduled)
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // ترتيب الحجوزات (الأقرب أولاً)
        $bookings = $query->orderBy('booking_date', 'desc')->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $bookings
        ]);
    }
}