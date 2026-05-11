<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\StoreBookingRequest;
use App\Models\Booking;
use App\Models\User;
use App\Services\BookingService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        /** @var User $user */
        $user = $request->user();

        // تحديد من هو الطالب الفعلي
        $student = $request->has('parent_student_id') && $user->hasRole('parent')
            ? User::findOrFail($request->parent_student_id)
            : $user;

        try {
            $booking = $this->bookingService->createBooking(
                $request->user(),
                $request->teacher_slot_id,
                $request->promo_code,
                $request->child_id // تمرير معرّف الابن هنا
            );

            $booking->load(['teacher', 'teacherSlot']);

            return response()->json([
                'status' => 'success',
                'message' => 'تم تأكيد الحجز وخصم المبلغ بنجاح!',
                'data' => $booking,
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    // 2. جلب قائمة حجوزاتي
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $query = Booking::with(['teacher', 'student', 'teacherSlot', 'review']);

        if ($user->hasRole('teacher')) {
            $query->where('teacher_id', $user->id);
        } else {
            $query->where('student_id', $user->id)->orWhere('booked_by_id', $user->id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $bookings = $query->orderBy('booking_date', 'desc')->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $bookings,
        ]);
    }

    // 3. إنهاء الحصة وتحويل الأرباح للمعلم (هذه الدالة كانت خارج الـ Class في كودك)
    public function complete(Request $request, $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $booking = Booking::findOrFail($id);

        // حماية: لا يمكن لأحد إنهاء الحصة إلا المعلم صاحب الحصة
        if ($user->id !== $booking->teacher_id) {
            return response()->json(['message' => 'غير مصرح لك بإنهاء هذه الحصة'], 403);
        }

        try {
            $completedBooking = $this->bookingService->completeBooking($booking);

            return response()->json([
                'status' => 'success',
                'message' => 'تم إنهاء الحصة بنجاح وتحويل الأرباح لمحفظتك! 💰',
                'data' => $completedBooking,
            ]);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    // إلغاء الحصة من قبل المعلم
    public function cancel(Request $request, $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $booking = Booking::findOrFail($id);

        // حماية: المعلم صاحب الحصة فقط من يمكنه الإلغاء
        if ($user->id !== $booking->teacher_id) {
            return response()->json(['message' => 'غير مصرح لك بإلغاء هذه الحصة'], 403);
        }

        try {
            $cancelledBooking = $this->bookingService->cancelBooking($booking, $user);

            return response()->json([
                'status' => 'success',
                'message' => 'تم إلغاء الحصة وإرجاع المبلغ لمحفظة الطالب بنجاح.',
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 400);
        }
    }
}
