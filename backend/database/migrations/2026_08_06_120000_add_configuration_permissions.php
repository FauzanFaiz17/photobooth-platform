<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $modules = [
        'camera_profiles',
        'printer_profiles',
    ];

    private array $actions = [
        'view',
        'create',
        'update',
        'delete',
    ];

    public function up(): void
    {
        $now = now();

        foreach ($this->modules as $module) {
            foreach ($this->actions as $action) {
                $slug = "{$module}.{$action}";

                DB::table('permissions')->updateOrInsert(
                    ['slug' => $slug],
                    [
                        'name' => ucfirst($action).' '.ucwords(
                            str_replace('_', ' ', $module)
                        ),
                        'module' => $module,
                        'description' => ucfirst($action).' '.str_replace(
                            '_',
                            ' ',
                            $module
                        ),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }

        $superAdminRoleId = DB::table('roles')
            ->where('slug', 'super-admin')
            ->value('id');

        if (! $superAdminRoleId) {
            return;
        }

        $permissionIds = DB::table('permissions')
            ->whereIn('module', $this->modules)
            ->pluck('id');

        foreach ($permissionIds as $permissionId) {
            DB::table('role_permissions')->updateOrInsert(
                [
                    'role_id' => $superAdminRoleId,
                    'permission_id' => $permissionId,
                ],
                [
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }

    public function down(): void
    {
        $permissionIds = DB::table('permissions')
            ->whereIn('module', $this->modules)
            ->pluck('id');

        DB::table('role_permissions')
            ->whereIn('permission_id', $permissionIds)
            ->delete();

        DB::table('permissions')
            ->whereIn('id', $permissionIds)
            ->delete();
    }
};
