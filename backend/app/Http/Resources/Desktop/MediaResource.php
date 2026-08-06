<?php

namespace App\Http\Resources\Desktop;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'photo_session_id' => $this->photo_session_id,
            'type' => $this->type,
            'filename' => $this->filename,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'checksum' => $this->checksum,
            'width' => $this->width,
            'height' => $this->height,
            'duration_seconds' => $this->duration_seconds,
            'visibility' => $this->visibility,
        ];
    }
}
