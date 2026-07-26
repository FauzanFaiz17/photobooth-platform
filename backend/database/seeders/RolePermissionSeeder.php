<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $superAdmin = Role::where(
            'slug',
            'super-admin'
        )->first();

        $permissions = Permission::pluck('id');

        $superAdmin
            ->permissions()
            ->sync($permissions);
    }
}