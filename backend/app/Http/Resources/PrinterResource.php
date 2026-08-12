<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrinterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'partner_id' => $this->partner_id,
            'booth_id' => $this->booth_id, 'device_id' => $this->device_id,
            'name' => $this->name, 'driver_name' => $this->driver_name,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at, 'updated_at' => $this->updated_at,
        ];
    }
}
