<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('camera_snapshots', function (Blueprint $table) {
            $table->id();

            $table->foreignId('camera_profile_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('iso', 20)->nullable();
            $table->string('shutter_speed', 20)->nullable();
            $table->string('aperture', 20)->nullable();
            $table->string('white_balance', 20)->nullable();
            $table->string('exposure', 20)->nullable();
            $table->string('focus_mode', 30)->nullable();

            $table->unsignedInteger('countdown_seconds');
            $table->unsignedInteger('burst_count');

            $table->string('image_quality', 20)->nullable();

            $table->boolean('live_view');

            $table->unsignedInteger('version');

            $table->timestamp('created_at')->useCurrent();

            $table->index('camera_profile_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('camera_snapshots');
    }
};