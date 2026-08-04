<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('camera_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('partner_id')
                ->nullable()
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('name', 150);

            $table->string('iso', 20)->nullable();
            $table->string('shutter_speed', 20)->nullable();
            $table->string('aperture', 20)->nullable();
            $table->string('white_balance', 20)->nullable();
            $table->string('exposure', 20)->nullable();
            $table->string('focus_mode', 30)->nullable();

            $table->unsignedInteger('countdown_seconds')->default(3);
            $table->unsignedInteger('burst_count')->default(1);

            $table->string('image_quality', 20)->nullable();

            $table->boolean('live_view')->default(true);

            $table->unsignedInteger('version')->default(1);

            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index('partner_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('camera_profiles');
    }
};