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
    public function createBooking(User $student, int $teacherSlotId, ?string $promoCodeStr = null, ?int $bookedById = null): Booking
    {
        // 1. Atomic Lock: منع أي طلبين من دخول هذا الكود لنفس الموعد في نفس الـ 10 ثواني
        $lock = Cache::lock('booking_slot_' . $teacherSlotId, 10);

        if (!$lock->get()) {
            throw new Exception('جاري حجز هذا الموعد حالياً من قبل شخص آخر. يرجى المحاولة بعد قليل.');
        }

        try {
            return DB::transaction(function () use ($student, $teacherSlotId, $promoCodeStr, $bookedById) {
                // 2. قفل السجل في قاعدة البيانات (Pessimistic Lock)
                $slot = TeacherSlot::where('id', $teacherSlotId)->lockForUpdate()->firstOrFail();

                if ($slot->status !== 'available') {
                    throw new Exception('عفواً، هذا الموعد لم يعد متاحاً.');
                }

                // 3. جلب سعر الحصة بناءً على مرحلة الطالب
                // افترضنا أن الطالب يملك Profile مرتبط بـ GradeLevel
                $studentProfile = $student->studentProfile()->with('gradeLevel')->firstOrFail();
                $sessionPrice = $studentProfile->gradeLevel->session_price;
                $discount = 0.00;
                $promoCodeId = null;

                // 4. معالجة كود الخصم (إن وُجد)
                if ($promoCodeStr) {
                    $promo = PromoCode::where('code', $promoCodeStr)
                        ->where(function ($query) {
                            $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
                        })
                        ->lockForUpdate()
                        ->first();

                    if ($promo && $promo->used_count < $promo->max_uses) {
                        $discount = ($sessionPrice * $promo->discount_percentage) / 100;
                        $promoCodeId = $promo->id;
                        $promo->increment('used_count'); // زيادة عداد الاستخدام
                    } else {
                        throw new Exception('كود الخصم غير صالح أو انتهت صلاحيته.');
                    }
                }

                $netPaid = $sessionPrice - $discount;

                // 5. خصم المبلغ من المحفظة (الرقم سالب للخصم)
                // نستخدم 'withdrawal' كمصطلح لخصم الرصيد كما صممناه في الجدول
                $this->walletService->processTransaction(
                    $student, 
                    -$netPaid, 
                    'withdrawal', 
                    'دفع رسوم حجز حصة مع المعلم ' . $slot->teacher->name
                );

                // 6. تغيير حالة الموعد إلى محجوز
                $slot->update(['status' => 'booked']);

                // 7. إنشاء الحجز
                return Booking::create([
                    'student_id' => $student->id,
                    'booked_by_id' => $bookedById ?? $student->id,
                    'teacher_id' => $slot->teacher_id,
                    'teacher_slot_id' => $slot->id,
                    'promo_code_id' => $promoCodeId,
                    'booking_date' => $slot->slot_date,
                    'session_price' => $sessionPrice,
                    'discount_amount' => $discount,
                    'net_paid' => $netPaid,
                    'agora_channel' => uniqid('taj_ch_'), // توليد اسم غرفة فريد لـ Agora
                    'status' => 'scheduled'
                ]);
            });
        } finally {
            // الإفراج عن القفل فور الانتهاء أو حدوث خطأ
            $lock->release();
        }
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