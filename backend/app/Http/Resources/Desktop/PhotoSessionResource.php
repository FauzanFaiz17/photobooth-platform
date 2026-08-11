<?php

namespace App\Http\Resources\Desktop;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PhotoSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'partner_id' => $this->partner_id,
            'booth_id' => $this->booth_id,
            'device_id' => $this->device_id,
            'operator_id' => $this->operator_id,
            'event_id' => $this->event_id,
            'customer_id' => $this->customer_id,
            'payment_id' => $this->payment_id,
            'status' => $this->status,
            'download_token' => $this->download_token,
            'gallery' => $this->whenLoaded('downloadAccess', function () {
                if (! $this->downloadAccess) {
                    return null;
                }

                return [
                    'url' => route('gallery.show', $this->downloadAccess->token),
                    'expires_at' => $this->downloadAccess->expires_at,
                ];
            }),
            'started_at' => $this->started_at,
            'completed_at' => $this->completed_at,
            'media' => MediaResource::collection(
                $this->whenLoaded('media')
            ),
        ];
    }
}
