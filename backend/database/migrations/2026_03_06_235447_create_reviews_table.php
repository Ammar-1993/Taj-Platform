<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating'); // ممتاز، تم التعديل لمنع القيم السالبة
            $table->text('comment')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });

        // 🟢 التعديل هنا: وضع القيد بعد إنشاء الجدول
        DB::statement('ALTER TABLE reviews ADD CONSTRAINT chk_rating_range CHECK (rating >= 1 AND rating <= 5)');
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};