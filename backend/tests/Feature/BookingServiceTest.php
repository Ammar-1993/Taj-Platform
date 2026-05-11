<?php

namespace Tests\Feature;

use App\Models\GradeLevel;
use App\Models\PromoCode;
use App\Models\TeacherSlot;
use App\Models\User;
use App\Services\BookingService;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingServiceTest extends TestCase
{
    use RefreshDatabase;

    protected BookingService $bookingService;

    protected WalletService $walletService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->walletService = app(WalletService::class);
        $this->bookingService = app(BookingService::class);
    }

    public function test_student_can_book_available_slot_with_promo_code()
    {
        // 1. زرع البيانات الأساسية (Data Setup)
        $grade = GradeLevel::create(['name' => 'ثانوي', 'session_price' => 100.00, 'is_active' => true]);

        $student = User::create(['name' => 'طالب', 'email' => 's@taj.com', 'phone' => '1', 'password' => '123']);
        $student->studentProfile()->create(['grade_level_id' => $grade->id]);

        // شحن محفظة الطالب بـ 200 ريال
        $this->walletService->processTransaction($student, 200.00, 'deposit', 'شحن');

        $teacher = User::create(['name' => 'معلم', 'email' => 't@taj.com', 'phone' => '2', 'password' => '123']);
        $slot = TeacherSlot::create([
            'teacher_id' => $teacher->id,
            'slot_date' => now()->addDay(),
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'status' => 'available',
        ]);

        $promo = PromoCode::create([
            'code' => 'TEST50',
            'discount_percentage' => 50.00, // خصم 50%
            'max_uses' => 10,
            'used_count' => 0,
        ]);

        // 2. تنفيذ عملية الحجز
        $booking = $this->bookingService->createBooking($student, $slot->id, 'TEST50');

        // 3. التحقق (Assertions)
        // أ. الموعد أصبح محجوزاً
        $this->assertEquals('booked', $slot->refresh()->status);

        // ب. السعر كان 100، الخصم 50%، الصافي يجب أن يكون 50
        $this->assertEquals(50.00, $booking->net_paid);

        // ج. رصيد الطالب كان 200، انخصم 50، المتبقي يجب أن يكون 150
        $this->assertEquals(150.00, $student->wallet->refresh()->balance);

        // د. عدد استخدامات كود الخصم زاد بمقدار 1
        $this->assertEquals(1, $promo->refresh()->used_count);
    }

    public function test_it_prevents_double_booking()
    {
        // تجهيز بيانات الطالب
        $grade = GradeLevel::create(['name' => 'ابتدائي', 'session_price' => 50.00, 'is_active' => true]);
        $student = User::create(['name' => 'طالب', 'email' => 's2@taj.com', 'phone' => '3', 'password' => '123']);
        $student->studentProfile()->create(['grade_level_id' => $grade->id]);
        $this->walletService->processTransaction($student, 500.00, 'deposit', 'شحن');

        // 👈 الحل الجذري: إنشاء معلم حقيقي في قاعدة البيانات
        $teacher = User::create(['name' => 'معلم للاختبار', 'email' => 't2@taj.com', 'phone' => '4', 'password' => '123']);

        $slot = TeacherSlot::create([
            'teacher_id' => $teacher->id, // 👈 استخدام المعرف الحقيقي بدلاً من 999
            'slot_date' => now()->addDay(),
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'status' => 'booked', // الموعد محجوز مسبقاً!
        ]);

        // نتوقع أن يرمي خطأ
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('عفواً، هذا الموعد لم يعد متاحاً.');

        // محاولة حجز موعد محجوز مسبقاً
        $this->bookingService->createBooking($student, $slot->id);
    }
}
