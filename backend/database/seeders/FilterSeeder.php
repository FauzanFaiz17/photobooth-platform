<?php

namespace Database\Seeders;

use App\Models\Filter;
use Illuminate\Database\Seeder;

class FilterSeeder extends Seeder
{
    public function run(): void
    {
        $filters = [
            [
                'partner_id' => null,
                'name' => 'Natural',
                'lut_path' => null,
                'brightness' => 0,
                'contrast' => 0,
                'saturation' => 0,
                'sharpness' => 0,
                'white_balance' => 0,
                'intensity' => 100,
                'version' => 1,
                'is_active' => true,
            ],
            [
                'partner_id' => null,
                'name' => 'Warm',
                'lut_path' => null,
                'brightness' => 5,
                'contrast' => 3,
                'saturation' => 8,
                'sharpness' => 2,
                'white_balance' => 5,
                'intensity' => 100,
                'version' => 1,
                'is_active' => true,
            ],
            [
                'partner_id' => null,
                'name' => 'Cool',
                'lut_path' => null,
                'brightness' => 2,
                'contrast' => 2,
                'saturation' => -3,
                'sharpness' => 1,
                'white_balance' => -5,
                'intensity' => 100,
                'version' => 1,
                'is_active' => true,
            ],
            [
                'partner_id' => null,
                'name' => 'Black & White',
                'lut_path' => null,
                'brightness' => 0,
                'contrast' => 8,
                'saturation' => -100,
                'sharpness' => 3,
                'white_balance' => 0,
                'intensity' => 100,
                'version' => 1,
                'is_active' => true,
            ],
        ];

        foreach ($filters as $filter) {
            Filter::create($filter);
        }
    }
}