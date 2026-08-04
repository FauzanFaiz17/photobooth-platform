<?php

namespace Database\Seeders;

use App\Models\PrinterProfile;
use Illuminate\Database\Seeder;

class PrinterProfileSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            [
                'partner_id' => null,
                'printer_name' => 'DNP DS620',
                'copies' => 1,
                'paper_size' => '4x6',
                'orientation' => 'portrait',
                'auto_print' => true,
                'border' => false,
                'bleed' => 0,
                'delay_ms' => 0,
                'version' => 1,
                'is_active' => true,
            ],
            [
                'partner_id' => null,
                'printer_name' => 'Canon SELPHY CP1500',
                'copies' => 1,
                'paper_size' => '4x6',
                'orientation' => 'portrait',
                'auto_print' => true,
                'border' => false,
                'bleed' => 0,
                'delay_ms' => 0,
                'version' => 1,
                'is_active' => true,
            ],
        ];

        foreach ($profiles as $profile) {
            PrinterProfile::create($profile);
        }
    }
}