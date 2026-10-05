<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->unique()->constrained()->cascadeOnDelete();
            $table->longText('summary_content')->nullable();
            $table->json('key_takeaways')->nullable();
            $table->string('status', 20)->default('pending'); // pending, completed, failed
            $table->string('model_used', 50)->nullable();
            $table->unsignedInteger('tokens_used')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_summaries');
    }
};
