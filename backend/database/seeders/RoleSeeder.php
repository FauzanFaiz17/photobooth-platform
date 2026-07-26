<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [

            [
                'name' => 'Super Admin',
                'slug' => 'super-admin',
                'description' => 'System Owner',
                'is_system' => true,
            ],

            [
                'name' => 'Admin',
                'slug' => 'admin',
                'description' => 'System Administrator',
                'is_system' => true,
            ],

            [
                'name' => 'Partner Owner',
                'slug' => 'partner-owner',
                'description' => 'Owner Partner',
                'is_system' => true,
            ],

            [
                'name' => 'Partner Manager',
                'slug' => 'partner-manager',
                'description' => 'Manager Partner',
                'is_system' => true,
            ],

            [
                'name' => 'Operator',
                'slug' => 'operator',
                'description' => 'Photobooth Operator',
                'is_system' => true,
            ]

        ];

        foreach ($roles as $role) {

            Role::updateOrCreate(
                ['slug' => $role['slug']],
                $role
            );

        }
    }
}