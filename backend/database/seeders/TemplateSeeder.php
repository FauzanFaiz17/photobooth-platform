<?php

namespace Database\Seeders;

use App\Models\Template;
use Illuminate\Database\Seeder;

class TemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'partner_id' => null,
                'name' => 'Classic 2 Strip',
                'preview_path' => null,
                'thumbnail_path' => null,
                'json_layout' => [],
                'psd_path' => null,
                'png_path' => null,
                'version' => 1,
                'status' => 'published',
            ],
            [
                'partner_id' => null,
                'name' => 'Classic 4 Frame',
                'preview_path' => null,
                'thumbnail_path' => null,
                'json_layout' => [],
                'psd_path' => null,
                'png_path' => null,
                'version' => 1,
                'status' => 'published',
            ],
            [
                'partner_id' => null,
                'name' => 'Wedding Elegant',
                'preview_path' => null,
                'thumbnail_path' => null,
                'json_layout' => [],
                'psd_path' => null,
                'png_path' => null,
                'version' => 1,
                'status' => 'published',
            ],
            [
                'partner_id' => null,
                'name' => 'Graduation',
                'preview_path' => null,
                'thumbnail_path' => null,
                'json_layout' => [],
                'psd_path' => null,
                'png_path' => null,
                'version' => 1,
                'status' => 'published',
            ],
        ];

        foreach ($templates as $template) {
            Template::create($template);
        }
    }
}