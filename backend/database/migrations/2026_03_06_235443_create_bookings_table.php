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
      Schema::create('bookings', function (Blueprint $table) {
    $table->id();
    $table->foreignId('student_id')->constrained('users')->restrictOnDelete();
    $table->foreignId('booked_by_id')->constrained('users')->restrictOnDelete();
    $table->foreignId('teacher_id')->constrained('users')->restrictOnDelete();
    
    // الجدار الفولاذي
    $table->foreignId('teacher_slot_id')->unique()->constrained()->restrictOnDelete();
    
    $table->foreignId('promo_code_id')->nullable()->constrained()->nullOnDelete();
    $table->boolean('is_free_trial')->default(false);
    
    $table->date('booking_date');
    $table->decimal('session_price', 8, 2);
    $table->decimal('discount_amount', 8, 2)->default(0.00);
    $table->decimal('net_paid', 8, 2);
    
    $table->string('agora_channel')->unique();
    
    $table->timestamp('teacher_joined_at')->nullable();
    $table->timestamp('student_joined_at')->nullable();
    $table->timestamp('completed_at')->nullable();
    
    $table->enum('status', ['pending_payment', 'scheduled', 'in_progress', 'completed', 'cancelled', 'refunded'])->default('pending_payment');
    
   $table->timestamps();

    // فهارس مركبة (Composite Indexes) بدلاً من الفهرس الفردي الضعيف
    $table->index(['teacher_id', 'status', 'booking_date']);
    $table->index(['student_id', 'status']);
});         
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
