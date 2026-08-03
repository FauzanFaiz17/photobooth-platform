<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BoothResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'name' => $this->name,

            'location' => $this->location,

            'status' => $this->status,

            'created_at' => $this->created_at,

            'partner' => [

                'id' => $this->partner?->id,

                'company_name' => $this->partner?->company_name,

                'brand_name' => $this->partner?->brand_name,

            ],

            'devices_count' => $this->whenCounted('devices'),

        ];
    }
}