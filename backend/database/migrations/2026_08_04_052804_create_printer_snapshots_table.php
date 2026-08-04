<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('printer_snapshots', function (Blueprint $table) {
            $table->id();

            $table->foreignId('printer_profile_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('printer_name', 150);

            $table->unsignedInteger('copies');

            $table->string('paper_size', 30);

            $table->string('orientation', 20);

            $table->boolean('auto_print');

            $table->boolean('border');

            $table->decimal('bleed', 6, 2);

            $table->unsignedInteger('delay_ms');

            $table->unsignedInteger('version');

            $table->timestamp('created_at')->useCurrent();

            $table->index('printer_profile_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('printer_snapshots');
    }
};