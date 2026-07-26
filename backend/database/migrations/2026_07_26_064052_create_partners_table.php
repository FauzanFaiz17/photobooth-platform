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
        Schema::create('partners', function (Blueprint $table) {

            $table->id();

            $table->string('company_name',150);

            $table->string('brand_name',150)
                ->nullable();

            $table->string('slug',150)
                ->unique();

            $table->text('address')
                ->nullable();

            $table->string('phone',30)
                ->nullable();

            $table->string('email')
                ->unique();

            $table->string('tax_number',50)
                ->nullable();

            $table->string('logo_path')
                ->nullable();

            $table->enum('status',[
                'active',
                'suspended',
                'trial',
                'inactive'
            ])->default('trial');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partners');
    }
};
