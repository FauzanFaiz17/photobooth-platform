<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PartnerSubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'starts_at' => $this->starts_at,
            'ends_at' => $this->ends_at,
            'auto_renew' => $this->auto_renew,
            'cancelled_at' => $this->cancelled_at,
            'is_current' => $this->status === 'active'
                && $this->starts_at?->lte(now())
                && $this->ends_at?->gte(now()),
            'remaining_days' => $this->status === 'active'
                ? max(0, (int) now()->diffInDays($this->ends_at, false))
                : 0,
            'partner' => $this->whenLoaded('partner', fn () => [
                'id' => $this->partner->id,
                'company_name' => $this->partner->company_name,
                'slug' => $this->partner->slug,
            ]),
            'plan' => $this->whenLoaded('subscriptionPlan', fn () => [
                'id' => $this->subscriptionPlan->id,
                'name' => $this->subscriptionPlan->name,
                'billing_cycle' => $this->subscriptionPlan->billing_cycle,
                'price' => (float) $this->subscriptionPlan->price,
                'max_booths' => $this->subscriptionPlan->max_booths,
                'max_devices' => $this->subscriptionPlan->max_devices,
                'max_operators' => $this->subscriptionPlan->max_operators,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
