<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booths', function (Blueprint $table) {

            $table->id();

            $table->foreignId('partner_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('name', 150);

            $table->string('location', 255)
                ->nullable();

            $table->enum('status', [
                'active',
                'maintenance',
                'inactive'
            ])->default('active');

            $table->timestamps();
            $table->softDeletes();

            $table->index('partner_id');
            $table->index([
                'partner_id',
                'status'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booths');
    }
};