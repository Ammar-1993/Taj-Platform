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
        Schema::table('bookings', function (Blueprint $blueprint) {
            $blueprint->string('whiteboard_room_uuid')->nullable()->after('agora_channel');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $blueprint) {
            $blueprint->dropColumn('whiteboard_room_uuid');
        });
    }
};
