<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->date('slot_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->enum('status', ['available', 'booked'])->default('available');
            $table->timestamps();

            // Composite Index لتسريع البحث
            $table->index(['teacher_id', 'slot_date', 'status']);
        });

        // 🟢 التعديل هنا: وضع القيد بعد إنشاء الجدول
        DB::statement('ALTER TABLE teacher_slots ADD CONSTRAINT chk_time_logic CHECK (end_time > start_time)');
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_slots');
    }
};