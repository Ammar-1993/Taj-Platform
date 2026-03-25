<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // صاحب التذكرة
            $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete(); // رقم الحجز (اختياري)
            $table->string('subject'); // عنوان المشكلة
            $table->text('description'); // تفاصيل الشكوى
            $table->enum('status', ['open', 'in_progress', 'resolved', 'closed'])->default('open');
            $table->text('admin_reply')->nullable(); // رد الإدارة
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};
