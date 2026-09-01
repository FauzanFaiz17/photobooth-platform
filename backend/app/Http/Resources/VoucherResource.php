<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VoucherResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'partner_id' => $this->partner_id,
            'voucher_package_id' => $this->voucher_package_id,
            'code' => $this->code,
            'status' => $this->status,
            'usage_limit' => $this->usage_limit,
            'usage_count' => $this->usage_count,
            'remaining_uses' => max(0, (int) $this->usage_limit - (int) $this->usage_count),
            'expired_at' => $this->expired_at,
            'generated_by' => $this->generated_by,
            'redeemed_by' => $this->redeemed_by,
            'redeemed_at' => $this->redeemed_at,
            'package' => new VoucherPackageResource($this->whenLoaded('package')),
            'payment' => new PaymentResource($this->whenLoaded('payment')),
            'redemptions' => $this->whenLoaded('redemptions'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
