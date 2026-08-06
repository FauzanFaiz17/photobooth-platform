<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'partner' => $this->partner ? [
                'id' => $this->partner->id,
                'company_name' => $this->partner->company_name,
            ] : null,
            'is_global' => $this->partner_id === null,
            'name' => $this->name,
            'preview_path' => $this->preview_path,
            'thumbnail_path' => $this->thumbnail_path,
            'json_layout' => $this->json_layout,
            'psd_path' => $this->psd_path,
            'png_path' => $this->png_path,
            'version' => $this->version,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
