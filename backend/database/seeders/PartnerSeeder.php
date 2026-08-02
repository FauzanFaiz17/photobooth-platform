<?php

namespace Database\Seeders;

use App\Models\Partner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PartnerSeeder extends Seeder
{
    public function run(): void
    {
        $partners = [

            [

                'company_name' => 'Photobooth Garut',

                'brand_name' => 'PB Garut',

                'slug' => Str::slug('Photobooth Garut'),

                'address' => 'Garut',

                'phone' => '081111111111',

                'email' => 'garut@example.com',

                'status' => 'active'

            ],

            [

                'company_name' => 'Photobooth Bandung',

                'brand_name' => 'PB Bandung',

                'slug' => Str::slug('Photobooth Bandung'),

                'address' => 'Bandung',

                'phone' => '082222222222',

                'email' => 'bandung@example.com',

                'status' => 'trial'

            ]

        ];

        foreach ($partners as $partner) {

            Partner::updateOrCreate(

                [
                    'slug' => $partner['slug']
                ],

                $partner

            );

        }
    }
}