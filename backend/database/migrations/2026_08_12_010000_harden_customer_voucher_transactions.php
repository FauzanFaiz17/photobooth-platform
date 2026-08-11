<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->unique(['partner_id', 'phone'], 'customers_partner_phone_unique');
            $table->unique(['partner_id', 'email'], 'customers_partner_email_unique');
        });

        Schema::table('vouchers', function (Blueprint $table) {
            $table->string('idempotency_key', 100)->nullable()->after('code');
            $table->unique(['partner_id', 'idempotency_key'], 'vouchers_partner_idempotency_unique');
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropUnique('vouchers_partner_idempotency_unique');
            $table->dropColumn('idempotency_key');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropUnique('customers_partner_phone_unique');
            $table->dropUnique('customers_partner_email_unique');
        });
    }
};
