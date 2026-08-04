<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([

            // RoleSeeder::class,

            // PermissionSeeder::class,

            // RolePermissionSeeder::class,

            // SuperAdminSeeder::class,

            // SubscriptionPlanSeeder::class,

            // PartnerSeeder::class,

            // PartnerSubscriptionSeeder::class,

            TemplateSeeder::class,

            FilterSeeder::class,

            CameraProfileSeeder::class,
            
            PrinterProfileSeeder::class,

        ]);
    }
}