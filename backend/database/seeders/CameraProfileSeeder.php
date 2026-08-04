<?php

namespace Database\Seeders;

use App\Models\CameraProfile;
use Illuminate\Database\Seeder;

class CameraProfileSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            [
                'partner_id' => null,
                'name' => 'Canon R100 Indoor',
                'iso' => '400',
                'shutter_speed' => '1/125',
                'aperture' => 'f/5.6',
                'white_balance' => 'Auto',
                'exposure' => '0',
                'focus_mode' => 'AF',
                'countdown_seconds' => 3,
                'burst_count' => 4,
                'image_quality' => 'JPEG',
                'live_view' => true,
                'version' => 1,
                'is_active' => true,
            ],
            [
                'partner_id' => null,
                'name' => 'Canon R100 Outdoor',
                'iso' => '100',
                'shutter_speed' => '1/250',
                'aperture' => 'f/8',
                'white_balance' => 'Daylight',
                'exposure' => '0',
                'focus_mode' => 'AF',
                'countdown_seconds' => 3,
                'burst_count' => 4,
                'image_quality' => 'JPEG',
                'live_view' => true,
                'version' => 1,
                'is_active' => true,
            ],
        ];

        foreach ($profiles as $profile) {
            CameraProfile::create($profile);
        }
    }
}