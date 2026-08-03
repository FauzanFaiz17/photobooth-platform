<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionPlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'name' => $this->name,

            'price' => (float) $this->price,

            'billing_cycle' => $this->billing_cycle,

            'max_booths' => $this->max_booths,

            'max_devices' => $this->max_devices,

            'max_operators' => $this->max_operators,

            'features' => $this->features,

            'is_active' => $this->is_active,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,

        ];
    }
}