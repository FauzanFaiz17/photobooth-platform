<?php

namespace App\Http\Resources\Event;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CameraSnapshotResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'camera_profile_id' => $this->camera_profile_id,

            'iso' => $this->iso,

            'shutter_speed' => $this->shutter_speed,

            'aperture' => $this->aperture,

            'white_balance' => $this->white_balance,

            'exposure' => $this->exposure,

            'focus_mode' => $this->focus_mode,

            'countdown_seconds' => $this->countdown_seconds,

            'burst_count' => $this->burst_count,

            'image_quality' => $this->image_quality,

            'live_view' => (bool) $this->live_view,

            'version' => $this->version,
        ];
    }
}