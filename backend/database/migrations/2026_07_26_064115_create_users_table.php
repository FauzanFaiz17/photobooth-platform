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
        Schema::create('users', function (Blueprint $table) {

            $table->id();

            $table->foreignId('partner_id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('role_id')
                ->constrained()
                ->restrictOnDelete();

            $table->string('name',150);

            $table->string('email')
                ->unique();

            $table->timestamp('email_verified_at')
                ->nullable();

            $table->string('password');

            $table->string('phone',30)
                ->nullable();

            $table->string('avatar_path')
                ->nullable();

            $table->enum('status',[
                'active',
                'suspended',
                'invited',
                'inactive'
            ])->default('active');

            $table->timestamp('last_login_at')
                ->nullable();

            $table->string('last_login_ip',45)
                ->nullable();

            $table->rememberToken();

            $table->timestamps();

            $table->softDeletes();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
