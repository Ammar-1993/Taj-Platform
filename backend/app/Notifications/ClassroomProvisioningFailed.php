<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * ClassroomProvisioningFailed
 *
 * يُرسَل لمشرفي المنصة عندما تفشل عملية تجهيز الفصل الافتراضي
 * نهائياً بعد استنفاد جميع محاولات الإعادة (5 محاولات).
 *
 * يجب ضبط ADMIN_ALERT_EMAIL في .env لاستقبال هذا التنبيه.
 */
class ClassroomProvisioningFailed extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Booking   $booking,
        public readonly string    $errorMessage,
    ) {}

    /**
     * قنوات الإرسال: البريد الإلكتروني فقط (قابل للتوسعة لاحقاً بـ Slack).
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * بناء رسالة البريد الإلكتروني.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $booking = $this->booking;

        return (new MailMessage)
            ->subject("🚨 فشل تجهيز الفصل الافتراضي — حجز #{$booking->id}")
            ->greeting('تنبيه عاجل لفريق الإدارة')
            ->line("**فشل تجهيز الفصل الافتراضي للحجز رقم #{$booking->id}** بعد استنفاد جميع محاولات الإعادة.")
            ->line('**تفاصيل الحجز:**')
            ->line("- **الطالب:** " . ($booking->student->name ?? 'غير معروف'))
            ->line("- **المعلم:** " . ($booking->teacher->name ?? 'غير معروف'))
            ->line("- **تاريخ الحصة:** " . optional($booking->teacherSlot)->slot_date)
            ->line('')
            ->line('**رسالة الخطأ:**')
            ->line("`{$this->errorMessage}`")
            ->action('فتح لوحة التحكم', url('/admin/bookings/' . $booking->id))
            ->line('يرجى التحقق من إعدادات السبورة البيضاء وAPI Netless والتواصل مع الطالب.')
            ->salutation('نظام منصة تاج التعليمية');
    }

    /**
     * نسخة مصفوفة للتسجيل في قاعدة البيانات (اختياري).
     */
    public function toArray(object $notifiable): array
    {
        return [
            'booking_id'    => $this->booking->id,
            'error_message' => $this->errorMessage,
            'student_name'  => $this->booking->student->name ?? null,
            'teacher_name'  => $this->booking->teacher->name ?? null,
        ];
    }
}
