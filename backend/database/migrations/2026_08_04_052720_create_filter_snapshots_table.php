<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('filter_snapshots', function (Blueprint $table) {
            $table->id();

            $table->foreignId('filter_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('name', 150);

            $table->string('lut_path')->nullable();

            $table->decimal('brightness', 6, 2);
            $table->decimal('contrast', 6, 2);
            $table->decimal('saturation', 6, 2);
            $table->decimal('sharpness', 6, 2);
            $table->decimal('white_balance', 6, 2);
            $table->decimal('intensity', 6, 2);

            $table->unsignedInteger('version');

            $table->timestamp('created_at')->useCurrent();

            $table->index('filter_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('filter_snapshots');
    }
};