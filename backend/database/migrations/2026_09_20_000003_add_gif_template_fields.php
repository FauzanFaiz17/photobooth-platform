<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE templates ADD COLUMN type ENUM('photo','gif') NOT NULL DEFAULT 'photo' AFTER name");
        DB::statement("ALTER TABLE template_snapshots ADD COLUMN type ENUM('photo','gif') NOT NULL DEFAULT 'photo' AFTER name");

        Schema::table('events', function (Blueprint $table) {
            $table->foreignId('gif_template_snapshot_id')->nullable()->after('printer_snapshot_id')->constrained('template_snapshots')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropForeign(['gif_template_snapshot_id']);
            $table->dropColumn('gif_template_snapshot_id');
        });

        DB::statement('ALTER TABLE template_snapshots DROP COLUMN type');
        DB::statement('ALTER TABLE templates DROP COLUMN type');
    }
};
