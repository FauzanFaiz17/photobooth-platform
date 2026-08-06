<?php

namespace App\Http\Resources\Event;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FilterSnapshotResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'filter_id' => $this->filter_id,

            'name' => $this->name,

            'lut_path' => $this->lut_path,

            'brightness' => (float) $this->brightness,

            'contrast' => (float) $this->contrast,

            'saturation' => (float) $this->saturation,

            'sharpness' => (float) $this->sharpness,

            'white_balance' => (float) $this->white_balance,

            'intensity' => (float) $this->intensity,

            'version' => $this->version,
        ];
    }
}
