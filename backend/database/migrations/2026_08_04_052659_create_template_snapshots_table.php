<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('template_snapshots', function (Blueprint $table) {
            $table->id();

            $table->foreignId('template_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('name', 150);

            $table->string('preview_path')->nullable();
            $table->string('thumbnail_path')->nullable();

            $table->json('json_layout');

            $table->string('psd_path')->nullable();
            $table->string('png_path')->nullable();

            $table->unsignedInteger('version');

            $table->timestamp('created_at')->useCurrent();

            $table->index('template_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('template_snapshots');
    }
};