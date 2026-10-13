<?php

namespace App\Services;

use App\Events\BookingCreated;
use App\Jobs\GenerateSessionSummaryJob;
use App\Jobs\ProvisionVirtualClassroom;
use App\Models\Booking;
use App\Models\PromoCode;
use App\Models\TeacherSlot;
use App\Models\User;
use App\Notifications\NewBookingNotification;
use App\Support\BookingStatus;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

        $booking = DB::transaction(function () use ($student, $payer, $slotId, $promoCode) {
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
                'status' => BookingStatus::SCHEDULED,
                'agora_channel' => 'taj_'.bin2hex(random_bytes(16)),
            ]);

            // 5. تحديث حالة الموعد
            $slot->update(['status' => 'booked']);

            // 6. إرسال إشعار للمعلم
            $booking->teacher->notify(new NewBookingNotification($booking));

            // 7. بث حدث الحجز الجديد للوحة تحكم المعلم (Real-time update)
            event(new BookingCreated($booking));

            return $booking;
        });

        // 🟢 تفعيل التجهيز المسبق للغرفة الافتراضية في الخلفية
        ProvisionVirtualClassroom::dispatch($booking);

        return $booking;
    }

    /**
     * إنهاء الحصة وتحويل الأرباح للمعلم (80% للمعلم)
     */
    public function completeBooking(Booking $booking, ?User $actor = null, ?string $note = null): Booking
    {
        $completedBooking = DB::transaction(function () use ($booking, $actor, $note) {
            $booking = Booking::where('id', $booking->id)->lockForUpdate()->firstOrFail();

            if ($booking->status === BookingStatus::COMPLETED) {
                throw new Exception('تم إغلاق هذه الحصة مسبقاً.');
            }

            if (in_array($booking->status, [BookingStatus::CANCELLED, BookingStatus::REFUNDED], true)) {
                throw new Exception('لا يمكن إكمال هذه الحصة لأنها ملغاة.');
            }

            if ($booking->status === BookingStatus::ABANDONED && ! ($actor && $actor->hasRole('admin'))) {
                throw new Exception('هذه الحصة معلقة لدى الإدارة ولا يمكن إكمالها إلا من قبل المشرف.');
            }

            if ($booking->status === BookingStatus::SCHEDULED) {
                throw new Exception('لا يمكن إكمال الحصة قبل بدئها ودخول المعلم إلى الفصل.');
            }

            if (! BookingStatus::canTransition($booking->status, BookingStatus::COMPLETED)) {
                throw new Exception("لا يمكن إكمال الحصة في حالتها الحالية ({$booking->status}).");
            }

            // 🔒 حماية النزاهة المالية: منع إكمال الحصة وصرف أرباحها قبل حلول وقتها الفعلي
            $sessionStart = $booking->getSessionStartTime();
            $isAdmin = $actor && $actor->hasRole('admin');
            if ($sessionStart && now()->lessThan($sessionStart) && ! $isAdmin) {
                throw new Exception('لا يمكن إكمال الحصة قبل حلول موعدها المحدد.');
            }

            $updateData = [
                'status' => BookingStatus::COMPLETED,
                'completed_at' => now(),
            ];

            if ($note || $actor) {
                $metadata = $booking->metadata ?? [];
                if ($note) {
                    $metadata['admin_completion_note'] = $note;
                }
                if ($actor) {
                    $metadata['completed_by_id'] = $actor->id;
                }
                $updateData['metadata'] = $metadata;
            }

            $booking->update($updateData);

            // توزيع الأرباح: حساب بدقة الهللات (80% للمعلم و 20% للمنصة)
            $netPaidHalalas = (int) round(((float) $booking->net_paid) * 100);
            $teacherHalalas = (int) round($netPaidHalalas * 0.80);
            $platformHalalas = $netPaidHalalas - $teacherHalalas;
            $teacherShare = $teacherHalalas / 100;
            $platformShare = $platformHalalas / 100;

            $metadata = $booking->metadata ?? [];
            $metadata['teacher_share'] = $teacherShare;
            $metadata['platform_share'] = $platformShare;
            $metadata['commission_rate'] = 0.20;
            $booking->update(['metadata' => $metadata]);

            if ($teacherShare > 0) {
                $this->walletService->processTransaction(
                    $booking->teacher,
                    $teacherShare,
                    'class_earnings',
                    'أرباح حصة منتهية رقم #'.$booking->id,
                    $booking->id,
                    "booking_earnings:{$booking->id}"
                );
            }

            // إزالة جميع توكنات الفصل الافتراضي فور اكتمال الحصة لمنع أي وصول لاحق
            $this->clearClassroomCacheTokens($booking);

            return $booking;
        });

        // 🚀 إطلاق مهمة توليد الملخص والاختبار الذكي في الخلفية بعد اكتمال الحصة
        try {
            GenerateSessionSummaryJob::dispatch($completedBooking);
        } catch (\Throwable $e) {
            Log::warning("Failed to dispatch GenerateSessionSummaryJob for booking #{$completedBooking->id}: ".$e->getMessage());
        }

        return $completedBooking;
    }

    /**
     * إلغاء الحجز واسترجاع الأموال (Refund)
     */
    public function cancelBooking(Booking $booking, User $canceller, ?string $reason = null): Booking
    {
        return DB::transaction(function () use ($booking, $canceller, $reason) {
            $booking = Booking::where('id', $booking->id)->lockForUpdate()->firstOrFail();

            if (! in_array($booking->status, [BookingStatus::SCHEDULED, BookingStatus::IN_PROGRESS, BookingStatus::ABANDONED], true)
                || ! BookingStatus::canTransition($booking->status, BookingStatus::CANCELLED)) {
                throw new Exception('لا يمكن إلغاء هذه الحصة في حالتها الحالية.');
            }

            if ($booking->status === BookingStatus::ABANDONED && ! $canceller->hasRole('admin')) {
                throw new Exception('هذه الحصة معلقة لدى الإدارة ولا يمكن إلغاؤها إلا من قبل المشرف.');
            }

            $updateData = ['status' => BookingStatus::CANCELLED];

            if ($reason || $canceller) {
                $metadata = $booking->metadata ?? [];
                if ($reason) {
                    $metadata['cancellation_reason'] = $reason;
                }
                $metadata['cancelled_by_id'] = $canceller->id;
                $metadata['cancelled_at'] = now()->toIso8601String();
                $updateData['metadata'] = $metadata;
            }

            // 1. تغيير حالة الحجز
            $booking->update($updateData);

            // 2. إعادة الموعد ليكون متاحاً لطلاب آخرين
            $booking->teacherSlot?->update(['status' => 'available']);

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

            // 4. إزالة جميع توكنز الفصل الافتراضي (Agora + RTM + السبورة) من الكاش
            $this->clearClassroomCacheTokens($booking);

            return $booking;
        });
    }

    /**
     * يمسح كل توكنات الوصول للفصل الافتراضي المرتبطة بحجز معين من الكاش:
     * Agora RTC، Agora RTM، وتوكنات السبورة التفاعلية (Netless).
     * يُستخدم عند إلغاء الحجز أو عند إغلاق حصة مهجورة تلقائياً.
     */
    private function clearClassroomCacheTokens(Booking $booking): void
    {
        app(AgoraService::class)->invalidateTokens(
            $booking->agora_channel ?? '',
            $booking->teacher_id,
            $booking->student_id,
            $booking->id
        );

        if ($booking->whiteboard_room_uuid) {
            Cache::forget("whiteboard_token_{$booking->whiteboard_room_uuid}_admin");
            Cache::forget("whiteboard_token_{$booking->whiteboard_room_uuid}_reader");
        }
    }

    /**
     * يُغلق حصة عالقة في in_progress دون أي نبضة حياة حديثة.
     * لا يُطلق أي معاملة مالية — فقط يُنهي حالة الحجز ويحرر الموعد ويمسح التوكنات.
     */
    public function abandonBooking(Booking $booking): Booking
    {
        return DB::transaction(function () use ($booking) {
            $booking = Booking::where('id', $booking->id)->lockForUpdate()->firstOrFail();

            // إعادة الفحص داخل القفل: قد تكون اكتملت أو أُلغيت بين لحظة الاستعلام وهذه اللحظة
            if ($booking->status !== BookingStatus::IN_PROGRESS) {
                return $booking;
            }

            $booking->update(['status' => BookingStatus::ABANDONED]);
            $booking->teacherSlot?->update(['status' => 'available']);

            $this->clearClassroomCacheTokens($booking);

            return $booking;
        });
    }
}
