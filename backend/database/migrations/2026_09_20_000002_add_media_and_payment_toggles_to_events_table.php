<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('payment_mode', 20)->default('full')->after('price');
            $table->boolean('video_enabled')->default(true)->after('payment_mode');
            $table->boolean('gif_enabled')->default(true)->after('video_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['payment_mode', 'video_enabled', 'gif_enabled']);
        });
    }
};
