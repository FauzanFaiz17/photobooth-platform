<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PartnerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'company_name' => $this->company_name,

            'brand_name' => $this->brand_name,

            'slug' => $this->slug,

            'address' => $this->address,

            'phone' => $this->phone,

            'email' => $this->email,

            'tax_number' => $this->tax_number,

            'logo' => $this->logo_path,

            'status' => $this->status,

            'created_at' => $this->created_at,

            'subscription' => $this->whenLoaded(
                'activeSubscription',
                function () {

                    if (! $this->activeSubscription) {
                        return null;
                    }

                    return [

                        'id' => $this->activeSubscription?->id,

                        'status' => $this->activeSubscription?->status,

                        'starts_at' => $this->activeSubscription?->starts_at,

                        'ends_at' => $this->activeSubscription?->ends_at,

                        'plan' => [

                            'id' => $this->activeSubscription?->subscriptionPlan?->id,

                            'name' => $this->activeSubscription?->subscriptionPlan?->name,

                        ],

                    ];

                }
            ),

        ];
    }
}
