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
        Schema::create('subscription_plans', function (Blueprint $table) {

            $table->id();

            $table->string('name',100)->unique();

            $table->decimal('price',15,2);

            $table->string('billing_cycle',20)
                ->default('monthly');

            $table->unsignedInteger('max_booths')
                ->default(1);

            $table->unsignedInteger('max_devices')
                ->default(1);

            $table->unsignedInteger('max_operators')
                ->default(5);

            $table->text('features')
                ->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();

            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};
