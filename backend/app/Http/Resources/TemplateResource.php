<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class TemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        URL::forceRootUrl($request->getSchemeAndHttpHost());
        $assetUrl = function (?string $path, string $type) use ($request): ?string {
            if (! $path) return null;
            return URL::temporarySignedRoute('template-assets.show', now()->addMinutes(30), ['type' => $type, 'path' => $path]);
        };
        return [
            'id' => $this->id,
            'partner' => $this->partner ? [
                'id' => $this->partner->id,
                'company_name' => $this->partner->company_name,
            ] : null,
            'is_global' => $this->partner_id === null,
            'name' => $this->name,
            'preview_path' => $this->preview_path,
            'preview_url' => $assetUrl($this->preview_path, 'preview'),
            'thumbnail_path' => $this->thumbnail_path,
            'thumbnail_url' => $assetUrl($this->thumbnail_path, 'thumbnail'),
            'json_layout' => $this->json_layout,
            'psd_path' => $this->psd_path,
            'png_path' => $this->png_path,
            'png_url' => $assetUrl($this->png_path, 'png'),
            'version' => $this->version,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
