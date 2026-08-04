<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();

            $table->foreignId('partner_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreignId('booth_id')
                ->constrained()
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('created_by')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('event_name', 150);

            $table->string('event_code', 30)->unique();

            $table->foreignId('template_snapshot_id')
                ->constrained('template_snapshots')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('filter_snapshot_id')
                ->constrained('filter_snapshots')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('camera_snapshot_id')
                ->constrained('camera_snapshots')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('printer_snapshot_id')
                ->constrained('printer_snapshots')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->date('event_date');

            $table->time('start_time');

            $table->time('end_time');

            $table->decimal('price', 15, 2)->default(0);

            $table->unsignedInteger('print_count_limit')->default(0);

            $table->enum('status', [
                'draft',
                'scheduled',
                'ongoing',
                'completed',
                'cancelled',
            ])->default('draft');

            $table->timestamps();

            $table->softDeletes();

            $table->index('partner_id');
            $table->index('booth_id');
            $table->index(['partner_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};