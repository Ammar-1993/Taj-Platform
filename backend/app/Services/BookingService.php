<?php

namespace App\Services;

use App\Events\BookingCreated;
use App\Models\Booking;
use App\Models\PromoCode;
use App\Models\TeacherSlot;
use App\Models\User;
use App\Notifications\NewBookingNotification;
use App\Services\WhiteboardService;
use Exception;
use Illuminate\Support\Facades\DB;

class BookingService
{
    protected WalletService $walletService;
    protected WhiteboardService $whiteboardService;

    public function __construct(WalletService $walletService, WhiteboardService $whiteboardService)
    {
        $this->walletService = $walletService;
        $this->whiteboardService = $whiteboardService;
    }

    /**
     * إنشاء حجز جديد (عملية معقدة ومحمية ضد الحجز المزدوج)
     */
    public function createBooking(User $user, int $slotId, ?string $promoCode = null, ?int $childId = null)
    {
        // ... (previous logic)
        $student = $user;
        $payer = $user;

        if ($user->hasRole('parent')) {
            if (! $childId) {
                throw new Exception('يجب تحديد الابن لحجز الحصة.');
            }
            $student = User::findOrFail($childId); // الطالب هو الابن
            $payer = $user; // الممول هو الأب
        }

        return DB::transaction(function () use ($student, $payer, $slotId, $promoCode) {
            // ... (previous logic)
            // قفل الموعد لمنع الحجز المزدوج
            $slot = TeacherSlot::where('id', $slotId)->lockForUpdate()->first();

            if (! $slot || $slot->status !== 'available') {
                throw new Exception('عفواً، هذا الموعد لم يعد متاحاً.');
            }

            // التأكد من أن الطالب لديه مرحلة دراسية محددة لمعرفة السعر
            $gradeLevel = $student->studentProfile->gradeLevel ?? null;
            if (! $gradeLevel) {
                throw new Exception('يجب تحديد المرحلة الدراسية للطالب أولاً لمعرفة سعر الحصة.');
            }

            $sessionPrice = $gradeLevel->session_price;
            $discountAmount = 0;

            if ($promoCode) {
                $promo = PromoCode::where('code', $promoCode)->first();
                if ($promo && $promo->isValid()) {
                    $discountAmount = ($sessionPrice * $promo->discount_percentage) / 100;
                    $promo->increment('used_count');
                }
            }

            $netPrice = $sessionPrice - $discountAmount;

            // 2. التحقق من رصيد محفظة الممول (الأب أو الطالب نفسه)
            if ($payer->wallet->balance < $netPrice) {
                throw new Exception('رصيد المحفظة غير كافٍ لإتمام الحجز. يرجى الشحن أولاً.');
            }

            // 3. خصم المبلغ من الممول 💰
            $this->walletService->processTransaction(
                $payer,
                -$netPrice,
                'withdrawal',
                "خصم لحجز موعد رقم #{$slot->id} للطالب: {$student->name}"
            );

            // 🟢 إنشاء غرفة سبورة تفاعلية لهذا الحجز
            $whiteboardUuid = null;
            try {
                $whiteboardUuid = $this->whiteboardService->createRoom("حصة: {$student->name} مع {$slot->teacher->name}");
            } catch (Exception $e) {
                // نسجل الخطأ ولكن لا نوقف الحجز إذا فشلت السبورة (يمكن محاولة إنشائها لاحقاً)
                \Log::error("Whiteboard creation failed for booking: " . $e->getMessage());
            }

            // 4. إنشاء الحجز باسم الطالب 🎓
            $booking = Booking::create([
                'student_id' => $student->id,
                'teacher_id' => $slot->teacher_id,
                'booked_by_id' => $payer->id, // توثيق من قام بالدفع
                'teacher_slot_id' => $slot->id,
                'booking_date' => now(),
                'session_price' => $sessionPrice,
                'discount_amount' => $discountAmount,
                'net_paid' => $netPrice,
                'status' => 'scheduled',
                'agora_channel' => 'taj_'.uniqid(),
                'whiteboard_room_uuid' => $whiteboardUuid,
            ]);

            // 5. تحديث حالة الموعد
            $slot->update(['status' => 'booked']);

            // 6. إرسال إشعار للمعلم
            $booking->teacher->notify(new NewBookingNotification($booking));

            // 7. بث حدث الحجز الجديد للوحة تحكم المعلم (Real-time update)
            event(new BookingCreated($booking));

            return $booking;
        });
    }

    /**
     * إنهاء الحصة وتحويل الأرباح للمعلم (80% للمعلم)
     */
    public function completeBooking(Booking $booking): Booking
    {
        return DB::transaction(function () use ($booking) {
            $booking = Booking::where('id', $booking->id)->lockForUpdate()->firstOrFail();

            if ($booking->status === 'completed') {
                throw new Exception('تم إغلاق هذه الحصة مسبقاً.');
            }

            $booking->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            // توزيع الأرباح: 80% تذهب لمحفظة المعلم، و20% تظل في حساب المنصة (لا تضاف لمحفظة أحد)
            $teacherShare = $booking->net_paid * 0.80;

            if ($teacherShare > 0) {
                $this->walletService->processTransaction(
                    $booking->teacher,
                    $teacherShare,
                    'class_earnings', // إيداع أرباح
                    'أرباح حصة منتهية رقم #'.$booking->id,
                    $booking->id
                );
            }

            return $booking;
        });
    }

    /**
     * إلغاء الحجز واسترجاع الأموال (Refund)
     */
    public function cancelBooking(Booking $booking, User $canceller): Booking
    {
        return DB::transaction(function () use ($booking) {
            $booking = Booking::where('id', $booking->id)->lockForUpdate()->firstOrFail();

            if (! in_array($booking->status, ['scheduled', 'in_progress'])) {
                throw new Exception('لا يمكن إلغاء هذه الحصة في حالتها الحالية.');
            }

            // 1. تغيير حالة الحجز
            $booking->update(['status' => 'cancelled']);

            // 2. إعادة الموعد ليكون متاحاً لطلاب آخرين
            $booking->teacherSlot->update(['status' => 'available']);

            // 3. استرجاع المبلغ لممول الحصة (الطالب أو ولي الأمر) 💰
            $payer = User::find($booking->booked_by_id);
            if ($payer) {
                $this->walletService->processTransaction(
                    $payer,
                    $booking->net_paid,
                    'refund',
                    "استرجاع مالي لإلغاء الحصة رقم #{$booking->id} مع الأستاذ {$booking->teacher->name}",
                    $booking->id
                );
            }

            return $booking;
        });
    }
}
