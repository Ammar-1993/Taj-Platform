<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE bookings MODIFY COLUMN status ENUM('pending_payment', 'scheduled', 'in_progress', 'completed', 'cancelled', 'refunded', 'abandoned') DEFAULT 'pending_payment'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE bookings MODIFY COLUMN status ENUM('pending_payment', 'scheduled', 'in_progress', 'completed', 'cancelled', 'refunded') DEFAULT 'pending_payment'");
    }
};
