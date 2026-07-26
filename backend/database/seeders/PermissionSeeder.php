<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [

            'users',
            'partners',
            'roles',
            'permissions',
            'subscriptions',
            'booths',
            'devices',
            'templates',
            'filters',
            'events',
            'vouchers',
            'payments',
            'sessions',
            'media',
            'reports',
            'settings',

        ];

        $actions = [

            'view',
            'create',
            'update',
            'delete',

        ];

        foreach ($modules as $module) {

            foreach ($actions as $action) {

                Permission::updateOrCreate(

                    [
                        'slug' => "{$module}.{$action}"
                    ],

                    [
                        'name' => ucfirst($action) . ' ' . ucfirst($module),

                        'module' => $module,

                        'description' => ucfirst($action).' '.$module

                    ]

                );

            }

        }
    }
}