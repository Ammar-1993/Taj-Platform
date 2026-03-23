<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\PromoCode;
use App\Models\TeacherSlot;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Exception;

class BookingService
{
    protected WalletService $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    /**
     * إنشاء حجز جديد (عملية معقدة ومحمية ضد الحجز المزدوج)
     */
public function createBooking(\App\Models\User $user, int $slotId, ?string $promoCode = null, ?int $childId = null)
    {
        // 1. تحديد من هو الطالب (الذي سيحضر) ومن هو الممول (الذي سيدفع)
        $student = $user;
        $payer = $user;

        if ($user->hasRole('parent')) {
            if (!$childId) {
                throw new \Exception('يجب تحديد الابن لحجز الحصة.');
            }
            $student = \App\Models\User::findOrFail($childId); // الطالب هو الابن
            $payer = $user; // الممول هو الأب
        }

        return DB::transaction(function () use ($student, $payer, $slotId, $promoCode) {
            // قفل الموعد لمنع الحجز المزدوج
            $slot = TeacherSlot::where('id', $slotId)->lockForUpdate()->first();

            if (!$slot || $slot->status !== 'available') {
                throw new \Exception('عفواً، هذا الموعد لم يعد متاحاً.');
            }

            // التأكد من أن الطالب لديه مرحلة دراسية محددة لمعرفة السعر
            $gradeLevel = $student->studentProfile->gradeLevel ?? null;
            if (!$gradeLevel) {
                throw new \Exception('يجب تحديد المرحلة الدراسية للطالب أولاً لمعرفة سعر الحصة.');
            }

            $sessionPrice = $gradeLevel->session_price;
            $discountAmount = 0;

            // تطبيق كود الخصم (إن وجد)
            if ($promoCode) {
                $promo = PromoCode::where('code', $promoCode)->where('is_active', true)->first();
                if ($promo && $promo->isValid()) {
                    $discountAmount = ($sessionPrice * $promo->discount_percentage) / 100;
                    $promo->increment('used_count');
                }
            }

            $netPrice = $sessionPrice - $discountAmount;

            // 2. التحقق من رصيد محفظة الممول (الأب أو الطالب نفسه)
            if ($payer->wallet->balance < $netPrice) {
                throw new \Exception('رصيد المحفظة غير كافٍ لإتمام الحجز. يرجى الشحن أولاً.');
            }

            // 3. خصم المبلغ من الممول 💰
            $this->walletService->processTransaction(
                $payer,
                -$netPrice,
                'withdrawal',
                "خصم لحجز موعد رقم #{$slot->id} للطالب: {$student->name}"
            );

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
                // إنشاء رابط غرفة افتراضي فريد
                'agora_channel' => 'taj_' . uniqid() 
            ]);

            // 5. تحديث حالة الموعد
            $slot->update(['status' => 'booked']);

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
                'completed_at' => now()
            ]);

            // توزيع الأرباح: 80% تذهب لمحفظة المعلم، و20% تظل في حساب المنصة (لا تضاف لمحفظة أحد)
            $teacherShare = $booking->net_paid * 0.80;

            if ($teacherShare > 0) {
                $this->walletService->processTransaction(
                    $booking->teacher,
                    $teacherShare,
                    'class_earnings', // إيداع أرباح
                    'أرباح حصة منتهية رقم #' . $booking->id,
                    $booking->id
                );
            }

            return $booking;
        });
    }
}