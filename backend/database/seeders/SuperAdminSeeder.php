<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $role = Role::where('slug', 'super-admin')->first();

        User::updateOrCreate(

            [
                'email' => 'superadmin@photobooth.com'
            ],

            [

                'partner_id' => null,

                'role_id' => $role->id,

                'name' => 'Super Administrator',

                'password' => Hash::make('Admin@12345'),

                'phone' => '081234567890',

                'status' => 'active',

                'email_verified_at' => now()

            ]

        );
    }
}