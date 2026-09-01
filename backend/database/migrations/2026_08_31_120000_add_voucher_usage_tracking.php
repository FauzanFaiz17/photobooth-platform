<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('voucher_packages', function (Blueprint $table) {
            $table->unsignedInteger('session_count')->default(1)->after('print_count');
        });

        Schema::table('vouchers', function (Blueprint $table) {
            $table->unsignedInteger('usage_limit')->default(1)->after('status');
            $table->unsignedInteger('usage_count')->default(0)->after('usage_limit');
        });

        Schema::create('voucher_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('voucher_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('redeemed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('usage_number');
            $table->timestamp('redeemed_at');
            $table->timestamps();
            $table->unique(['voucher_id', 'usage_number']);
            $table->index(['voucher_id', 'redeemed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voucher_redemptions');
        Schema::table('vouchers', fn (Blueprint $table) => $table->dropColumn(['usage_limit', 'usage_count']));
        Schema::table('voucher_packages', fn (Blueprint $table) => $table->dropColumn('session_count'));
    }
};
