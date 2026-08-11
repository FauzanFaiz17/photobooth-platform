<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VoucherPackageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'partner_id' => $this->partner_id,
            'name' => $this->name,
            'price' => (float) $this->price,
            'persons' => $this->persons,
            'captures' => $this->captures,
            'print_count' => $this->print_count,
            'gif_included' => $this->gif_included,
            'video_included' => $this->video_included,
            'template_id' => $this->template_id,
            'validity_days' => $this->validity_days,
            'is_active' => $this->is_active,
            'vouchers_count' => $this->whenCounted('vouchers'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
