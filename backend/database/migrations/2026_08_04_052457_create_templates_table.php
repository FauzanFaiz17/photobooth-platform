<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('templates', function (Blueprint $table) {
            $table->id();

            $table->foreignId('partner_id')
                ->nullable()
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('name', 150);

            $table->string('preview_path')->nullable();
            $table->string('thumbnail_path')->nullable();

            $table->json('json_layout');

            $table->string('psd_path')->nullable();
            $table->string('png_path')->nullable();

            $table->unsignedInteger('version')->default(1);

            $table->enum('status', [
                'draft',
                'published',
                'archived'
            ])->default('draft');

            $table->timestamps();
            $table->softDeletes();

            $table->index('partner_id');
            $table->index(['partner_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('templates');
    }
};