<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('printers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('booth_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('device_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 150);
            $table->string('driver_name', 150)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('partner_id');
            $table->index('booth_id');
            $table->index('device_id');
        });

        Schema::create('print_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->foreignId('photo_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('printer_id')->constrained()->restrictOnDelete();
            $table->foreignId('printer_snapshot_id')->nullable()->constrained()->nullOnDelete();
            $table->string('idempotency_key', 100)->nullable();
            $table->unsignedInteger('copies')->default(1);
            $table->string('status', 20)->default('queued');
            $table->unsignedInteger('duration_ms')->nullable();
            $table->text('error_log')->nullable();
            $table->timestamp('queued_at')->useCurrent();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index('photo_session_id');
            $table->index('printer_id');
            $table->index(['partner_id', 'status']);
            $table->unique(['partner_id', 'idempotency_key']);
        });

        $now = now();
        foreach (['printers', 'print_jobs'] as $module) {
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
                ->whereIn('module', ['printers', 'print_jobs'])
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
        Schema::dropIfExists('print_jobs');
        Schema::dropIfExists('printers');

        $permissionIds = DB::table('permissions')
            ->whereIn('module', ['printers', 'print_jobs'])
            ->pluck('id');
        DB::table('role_permissions')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('id', $permissionIds)->delete();
    }
};
