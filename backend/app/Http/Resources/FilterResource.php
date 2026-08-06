<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FilterResource extends JsonResource
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
            'lut_path' => $this->lut_path,
            'brightness' => (float) $this->brightness,
            'contrast' => (float) $this->contrast,
            'saturation' => (float) $this->saturation,
            'sharpness' => (float) $this->sharpness,
            'white_balance' => (float) $this->white_balance,
            'intensity' => (float) $this->intensity,
            'version' => $this->version,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
