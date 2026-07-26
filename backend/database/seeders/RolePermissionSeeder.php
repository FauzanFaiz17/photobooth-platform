<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $superAdmin = Role::where('slug', 'super-admin')->first();

        if (!$superAdmin) {
            return;
        }

        $permissionIds = Permission::pluck('id');

        $superAdmin->permissions()->sync($permissionIds);
    }
}