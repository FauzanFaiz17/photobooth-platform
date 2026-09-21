<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('camera_profiles', function (Blueprint $table) {
            $table->string('picture_style', 30)->nullable()->after('white_balance');
            $table->string('contrast', 20)->nullable()->after('picture_style');
            $table->string('saturation', 20)->nullable()->after('contrast');
        });

        Schema::table('camera_snapshots', function (Blueprint $table) {
            $table->string('picture_style', 30)->nullable()->after('white_balance');
            $table->string('contrast', 20)->nullable()->after('picture_style');
            $table->string('saturation', 20)->nullable()->after('contrast');
        });
    }

    public function down(): void
    {
        Schema::table('camera_profiles', function (Blueprint $table) {
            $table->dropColumn(['picture_style', 'contrast', 'saturation']);
        });

        Schema::table('camera_snapshots', function (Blueprint $table) {
            $table->dropColumn(['picture_style', 'contrast', 'saturation']);
        });
    }
};
