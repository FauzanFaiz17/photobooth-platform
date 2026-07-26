<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [

            [
                'name' => 'Manage Users',
                'slug' => 'users.manage',
                'module' => 'users',
            ],

            [
                'name' => 'Manage Partners',
                'slug' => 'partners.manage',
                'module' => 'partners',
            ],

            [
                'name' => 'Manage Roles',
                'slug' => 'roles.manage',
                'module' => 'roles',
            ],

            [
                'name' => 'Manage Permissions',
                'slug' => 'permissions.manage',
                'module' => 'permissions',
            ],

        ];

        foreach ($permissions as $permission) {

            Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );

        }
    }
}