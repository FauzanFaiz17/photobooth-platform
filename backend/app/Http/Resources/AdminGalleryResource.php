<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminGalleryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'partner_id' => $this->partner_id,
            'booth_id' => $this->booth_id,
            'event_id' => $this->event_id,
            'customer' => $this->customer ? [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'email' => $this->customer->email,
                'phone' => $this->customer->phone,
            ] : null,
            'media' => $this->media->map(fn ($media) => [
                'id' => $media->id,
                'type' => $media->type,
                'filename' => $media->filename,
                'mime_type' => $media->mime_type,
                'size_bytes' => $media->size_bytes,
                'created_at' => $media->created_at,
            ])->values(),
            'gallery_url' => $this->downloadAccess
                ? rtrim(config('media.gallery_web_base_url'), '/').'/gallery/'.$this->downloadAccess->token
                : null,
            'expires_at' => $this->downloadAccess?->expires_at,
            'completed_at' => $this->completed_at,
            'created_at' => $this->created_at,
        ];
    }
}
