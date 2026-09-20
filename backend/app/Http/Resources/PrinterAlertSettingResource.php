<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrinterAlertSettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'printer_id' => $this->printer_id,
            'total_print_limit' => $this->total_print_limit,
            'low_stock_threshold' => $this->low_stock_threshold,
            'is_active' => $this->is_active,
            'last_notified_at' => $this->last_notified_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'recipients' => PrinterAlertRecipientResource::collection($this->whenLoaded('recipients')),
        ];
    }
}
