<?php

namespace App\Http\Resources\Event;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TemplateSnapshotResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'template_id' => $this->template_id,

            'name' => $this->name,
            'paper_size' => $this->paper_size,

            'preview_path' => $this->preview_path,

            'thumbnail_path' => $this->thumbnail_path,

            'json_layout' => $this->json_layout,

            'psd_path' => $this->psd_path,

            'png_path' => $this->png_path,

            'version' => $this->version,
        ];
    }
}
