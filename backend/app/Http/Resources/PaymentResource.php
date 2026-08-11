<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'partner_id' => $this->partner_id,
            'reference' => $this->reference,
            'gateway' => $this->gateway,
            'amount' => (float) $this->amount,
            'fee' => (float) $this->fee,
            'net_amount' => (float) $this->net_amount,
            'status' => $this->status,
            'voucher_id' => $this->voucher_id,
            'expired_at' => $this->expired_at,
            'paid_at' => $this->paid_at,
            'gateway_response' => $this->gateway_response,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
