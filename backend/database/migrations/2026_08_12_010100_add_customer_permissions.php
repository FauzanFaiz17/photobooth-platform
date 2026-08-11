<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $actions = ['view', 'create', 'update', 'delete'];

    public function up(): void
    {
        $now = now();

        foreach ($this->actions as $action) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => "customers.{$action}"],
                [
                    'name' => ucfirst($action).' Customers',
                    'module' => 'customers',
                    'description' => ucfirst($action).' customers',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        $superAdminRoleId = DB::table('roles')->where('slug', 'super-admin')->value('id');

        if (! $superAdminRoleId) {
            return;
        }

        $permissionIds = DB::table('permissions')
            ->where('module', 'customers')
            ->pluck('id');

        foreach ($permissionIds as $permissionId) {
            DB::table('role_permissions')->updateOrInsert(
                ['role_id' => $superAdminRoleId, 'permission_id' => $permissionId],
                ['created_at' => $now, 'updated_at' => $now]
            );
        }
    }

    public function down(): void
    {
        $permissionIds = DB::table('permissions')
            ->where('module', 'customers')
            ->pluck('id');

        DB::table('role_permissions')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('id', $permissionIds)->delete();
    }
};
