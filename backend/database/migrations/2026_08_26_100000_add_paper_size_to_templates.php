<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->string('paper_size', 10)->default('2r')->after('name')->index();
        });

        Schema::table('template_snapshots', function (Blueprint $table) {
            $table->string('paper_size', 10)->default('2r')->after('name')->index();
        });
    }

    public function down(): void
    {
        Schema::table('template_snapshots', fn (Blueprint $table) => $table->dropColumn('paper_size'));
        Schema::table('templates', fn (Blueprint $table) => $table->dropColumn('paper_size'));
    }
};
