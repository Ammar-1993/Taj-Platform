<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ALTER TABLE ... MODIFY COLUMN هو أمر خاص بـ MySQL فقط.
        // بيئة الاختبار تستخدم SQLite التي لا تدعم هذا الأمر،
        // لذا نتخطاها بأمان — قيمة 'abandoned' موجودة أصلاً في الـ Schema الأولي.
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE bookings MODIFY COLUMN status ENUM('pending_payment', 'scheduled', 'in_progress', 'completed', 'cancelled', 'refunded', 'abandoned') DEFAULT 'pending_payment'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE bookings MODIFY COLUMN status ENUM('pending_payment', 'scheduled', 'in_progress', 'completed', 'cancelled', 'refunded') DEFAULT 'pending_payment'");
        }
    }
};
