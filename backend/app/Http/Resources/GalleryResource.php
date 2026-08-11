<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GalleryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $session = $this->photoSession;

        return [
            'session_id' => $session->id,
            'completed_at' => $session->completed_at,
            'expires_at' => $this->expires_at,
            'media' => $session->media->map(fn ($media) => [
                'id' => $media->id,
                'type' => $media->type,
                'filename' => $media->filename,
                'mime_type' => $media->mime_type,
                'size_bytes' => $media->size_bytes,
                'width' => $media->width,
                'height' => $media->height,
                'duration_seconds' => $media->duration_seconds,
                'download_url' => route('gallery.media.download', [
                    'token' => $this->token,
                    'media' => $media->id,
                ]),
            ])->values(),
        ];
    }
}
