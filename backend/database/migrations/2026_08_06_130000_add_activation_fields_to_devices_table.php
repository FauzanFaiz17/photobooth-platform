<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->string('device_uuid', 100)->nullable()->change();
            $table->string('activation_code_hash', 64)->nullable()->unique()->after('device_uuid');
            $table->timestamp('activation_expires_at')->nullable()->after('activation_code_hash');
            $table->timestamp('activated_at')->nullable()->after('activation_expires_at');
        });

        DB::table('devices')
            ->where('status', 'active')
            ->whereNull('activated_at')
            ->update(['activated_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->dropUnique(['activation_code_hash']);
            $table->dropColumn([
                'activation_code_hash',
                'activation_expires_at',
                'activated_at',
            ]);
            $table->string('device_uuid', 100)->nullable(false)->change();
        });
    }
};
