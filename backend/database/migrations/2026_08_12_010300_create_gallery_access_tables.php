<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('download_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('photo_session_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('token', 64)->unique();
            $table->unsignedInteger('download_count')->default(0);
            $table->unsignedInteger('share_count')->default(0);
            $table->timestamp('expires_at');
            $table->timestamp('last_download_at')->nullable();
            $table->timestamps();
        });

        Schema::create('gallery_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('photo_session_id')->constrained()->cascadeOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamp('viewed_at')->useCurrent();
            $table->index('photo_session_id');
        });

        $now = now();
        $expiresAt = $now->copy()->addDays(config('media.gallery_token_ttl_days', 30));

        DB::table('photo_sessions')
            ->where('status', 'completed')
            ->orderBy('id')
            ->each(function ($session) use ($now, $expiresAt) {
                DB::table('download_tokens')->insert([
                    'photo_session_id' => $session->id,
                    'token' => $session->download_token,
                    'expires_at' => $expiresAt,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('gallery_views');
        Schema::dropIfExists('download_tokens');
    }
};
