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
        Schema::create('partner_monthly_reports', function(Blueprint $table){

            $table->id();

            $table->foreignId('partner_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->year('period_year');

            $table->unsignedTinyInteger('period_month');

            $table->decimal('total_revenue',18,2)
                ->default(0);

            $table->integer('total_sessions')
                ->default(0);

            $table->integer('total_customers')
                ->default(0);

            $table->integer('total_vouchers_used')
                ->default(0);

            $table->integer('total_qris_transactions')
                ->default(0);

            $table->integer('total_prints')
                ->default(0);

            $table->integer('total_downloads')
                ->default(0);

            $table->integer('total_media')
                ->default(0);

            $table->timestamp('generated_at');

            $table->unique(
                ['partner_id', 'period_year', 'period_month'],
                'partner_month_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_monthly_reports');
    }
};
