<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CameraProfileResource extends JsonResource
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
            'iso' => $this->iso,
            'shutter_speed' => $this->shutter_speed,
            'aperture' => $this->aperture,
            'white_balance' => $this->white_balance,
            'exposure' => $this->exposure,
            'focus_mode' => $this->focus_mode,
            'countdown_seconds' => $this->countdown_seconds,
            'burst_count' => $this->burst_count,
            'image_quality' => $this->image_quality,
            'live_view' => $this->live_view,
            'version' => $this->version,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
