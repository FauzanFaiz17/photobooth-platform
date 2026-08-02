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
        Schema::create('partner_subscriptions', function (Blueprint $table){

            $table->id();

            $table->foreignId('partner_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('subscription_plan_id')
                ->constrained()
                ->restrictOnDelete();

            $table->enum('status',[
                'pending',
                'active',
                'expired',
                'cancelled'
            ])->default('pending');

            $table->timestamp('starts_at');

            $table->timestamp('ends_at');

            $table->boolean('auto_renew')
                ->default(true);

            $table->timestamp('cancelled_at')
                ->nullable();

            $table->timestamps();

            $table->index('partner_id');

            $table->index([
                'partner_id',
                'status'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_subscriptions');
    }
};
