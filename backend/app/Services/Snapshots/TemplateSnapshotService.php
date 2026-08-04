<?php

namespace App\Services\Snapshots;

use App\Models\Template;
use App\Models\TemplateSnapshot;

class TemplateSnapshotService
{
    public function create(Template $template): TemplateSnapshot
    {
        return TemplateSnapshot::create([
            'template_id'    => $template->id,
            'name'           => $template->name,
            'preview_path'   => $template->preview_path,
            'thumbnail_path' => $template->thumbnail_path,
            'json_layout'    => $template->json_layout,
            'psd_path'       => $template->psd_path,
            'png_path'       => $template->png_path,
            'version'        => $template->version,
        ]);
    }
}