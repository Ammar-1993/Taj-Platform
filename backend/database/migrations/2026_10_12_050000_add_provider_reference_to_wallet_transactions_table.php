<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * مرجع خارجي فريد لحركات الشحن (مثال: moyasar:invoice:xxxx). القيمة NULL مسموحة ولا تتعارض
     * مع الحركات القديمة/الداخلية (الحجوزات، الأرباح، السحب)، بينما يمنع القيد الفريد تكرار الشحن لنفس الدفعة.
     */
    public function up(): void
    {
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->string('provider_reference', 191)->nullable()->after('description');
            $table->unique('provider_reference', 'uniq_wallet_tx_provider_reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->dropUnique('uniq_wallet_tx_provider_reference');
            $table->dropColumn('provider_reference');
        });
    }
};
