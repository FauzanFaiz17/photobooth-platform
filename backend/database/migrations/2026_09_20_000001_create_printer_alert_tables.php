<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('printer_alert_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('printer_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('total_print_limit')->default(100);
            $table->unsignedInteger('low_stock_threshold')->default(15);
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_notified_at')->nullable();
            $table->timestamps();

            $table->unique('printer_id');
        });

        Schema::create('printer_alert_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alert_setting_id')->constrained('printer_alert_settings')->cascadeOnDelete();
            $table->string('email');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['alert_setting_id', 'email']);
        });

        Schema::create('printer_alert_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alert_setting_id')->constrained('printer_alert_settings')->restrictOnDelete();
            $table->string('recipient_email');
            $table->unsignedInteger('remaining_prints');
            $table->string('channel', 20)->default('email');
            $table->timestamp('sent_at');
            $table->timestamps();

            $table->index('alert_setting_id');
            $table->index('sent_at');
        });

        $now = now();
        foreach (['printer_alert_settings', 'printer_alert_recipients', 'printer_alert_logs'] as $module) {
            foreach (['view', 'create', 'update', 'delete'] as $action) {
                DB::table('permissions')->updateOrInsert(
                    ['slug' => "{$module}.{$action}"],
                    [
                        'name' => ucfirst($action).' '.ucwords(str_replace('_', ' ', $module)),
                        'module' => $module,
                        'description' => ucfirst($action).' '.str_replace('_', ' ', $module),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }

        $superAdminRoleId = DB::table('roles')->where('slug', 'super-admin')->value('id');
        if ($superAdminRoleId) {
            $permissionIds = DB::table('permissions')
                ->whereIn('module', ['printer_alert_settings', 'printer_alert_recipients', 'printer_alert_logs'])
                ->pluck('id');

            foreach ($permissionIds as $permissionId) {
                DB::table('role_permissions')->updateOrInsert(
                    ['role_id' => $superAdminRoleId, 'permission_id' => $permissionId],
                    ['created_at' => $now, 'updated_at' => $now]
                );
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('printer_alert_logs');
        Schema::dropIfExists('printer_alert_recipients');
        Schema::dropIfExists('printer_alert_settings');

        $permissionIds = DB::table('permissions')
            ->whereIn('module', ['printer_alert_settings', 'printer_alert_recipients', 'printer_alert_logs'])
            ->pluck('id');
        DB::table('role_permissions')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('id', $permissionIds)->delete();
    }
};
