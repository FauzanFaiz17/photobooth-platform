<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrinterProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'partner' => $this->partner ? [
                'id' => $this->partner->id,
                'company_name' => $this->partner->company_name,
            ] : null,
            'is_global' => $this->partner_id === null,
            'printer_name' => $this->printer_name,
            'copies' => $this->copies,
            'paper_size' => $this->paper_size,
            'orientation' => $this->orientation,
            'auto_print' => $this->auto_print,
            'border' => $this->border,
            'bleed' => (float) $this->bleed,
            'delay_ms' => $this->delay_ms,
            'version' => $this->version,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
