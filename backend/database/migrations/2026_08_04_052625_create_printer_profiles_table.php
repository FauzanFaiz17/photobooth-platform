<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('printer_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('partner_id')
                ->nullable()
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('printer_name', 150);

            $table->unsignedInteger('copies')->default(1);

            $table->string('paper_size', 30);

            $table->string('orientation', 20)->default('portrait');

            $table->boolean('auto_print')->default(true);

            $table->boolean('border')->default(false);

            $table->decimal('bleed', 6, 2)->default(0);

            $table->unsignedInteger('delay_ms')->default(0);

            $table->unsignedInteger('version')->default(1);

            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index('partner_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('printer_profiles');
    }
};