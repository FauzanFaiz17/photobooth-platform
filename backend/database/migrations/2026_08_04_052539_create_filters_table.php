<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('filters', function (Blueprint $table) {
            $table->id();

            $table->foreignId('partner_id')
                ->nullable()
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('name', 150);

            $table->string('lut_path')->nullable();

            $table->decimal('brightness', 6, 2)->default(0);
            $table->decimal('contrast', 6, 2)->default(0);
            $table->decimal('saturation', 6, 2)->default(0);
            $table->decimal('sharpness', 6, 2)->default(0);
            $table->decimal('white_balance', 6, 2)->default(0);
            $table->decimal('intensity', 6, 2)->default(100);

            $table->unsignedInteger('version')->default(1);

            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index('partner_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('filters');
    }
};