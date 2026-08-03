<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {

            $table->id();

            $table->foreignId('partner_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('booth_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('device_key', 100)
                ->unique();

            $table->string('device_uuid', 100)
                ->unique();

            $table->string('device_name', 150);

            $table->string('windows_uuid', 150)
                ->nullable();

            $table->string('cpu_identifier', 150)
                ->nullable();

            $table->string('mac_address', 50)
                ->nullable();

            $table->string('app_version', 30)
                ->nullable();

            $table->timestamp('last_sync_at')
                ->nullable();

            $table->timestamp('last_login_at')
                ->nullable();

            $table->enum('status', [
                'pending',
                'active',
                'blocked',
                'revoked'
            ])->default('pending');

            $table->timestamps();
            $table->softDeletes();

            $table->index('partner_id');
            $table->index('booth_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};