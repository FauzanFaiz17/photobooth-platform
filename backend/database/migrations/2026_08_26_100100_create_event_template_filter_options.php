<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('template_snapshot_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->unique(['event_id', 'template_snapshot_id']);
            $table->index(['event_id', 'sort_order']);
        });

        Schema::create('event_filters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('filter_snapshot_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->unique(['event_id', 'filter_snapshot_id']);
            $table->index(['event_id', 'sort_order']);
        });

        Schema::create('event_print_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('paper_size', 10);
            $table->unsignedInteger('unit_quantity')->default(1);
            $table->unsignedInteger('quantity_step')->default(1);
            $table->decimal('price', 15, 2);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['event_id', 'paper_size', 'unit_quantity']);
            $table->index(['event_id', 'paper_size', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_print_options');
        Schema::dropIfExists('event_filters');
        Schema::dropIfExists('event_templates');
    }
};
