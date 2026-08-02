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
        Schema::create('partner_daily_stats', function (Blueprint $table){

            $table->id();

            $table->foreignId('partner_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->date('stat_date');

            $table->decimal('total_revenue',18,2)
                ->default(0);

            $table->integer('total_sessions')
                ->default(0);

            $table->integer('total_customers')
                ->default(0);

            $table->integer('total_prints')
                ->default(0);

            $table->integer('total_downloads')
                ->default(0);

            $table->timestamps();

            $table->unique([
                'partner_id',
                'stat_date'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_daily_stats');
    }
};
