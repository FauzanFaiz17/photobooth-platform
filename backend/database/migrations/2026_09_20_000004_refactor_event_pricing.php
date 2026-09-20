<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('price');
        });

        Schema::table('event_print_options', function (Blueprint $table) {
            $table->decimal('discount', 15, 2)->nullable()->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('event_print_options', function (Blueprint $table) {
            $table->dropColumn('discount');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->decimal('price', 15, 2)->default(0)->after('end_time');
        });
    }
};
