<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_daily_stats', function (Blueprint $table) {
            $table->id();
            $table->date('stat_date')->unique();
            $table->unsignedInteger('total_partners')->default(0);
            $table->unsignedInteger('total_booths')->default(0);
            $table->unsignedInteger('total_devices')->default(0);
            $table->unsignedInteger('total_events')->default(0);
            $table->unsignedInteger('total_sessions')->default(0);
            $table->unsignedInteger('total_payments')->default(0);
            $table->unsignedInteger('total_media')->default(0);
            $table->unsignedInteger('total_print_jobs')->default(0);
            $table->unsignedInteger('total_uploads')->default(0);
            $table->unsignedInteger('total_downloads')->default(0);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 30);
            $table->string('subject_type', 150)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('description', 500)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('partner_id');
            $table->index('user_id');
            $table->index('action');
            $table->index(['subject_type', 'subject_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('admin_daily_stats');
    }
};
