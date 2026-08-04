<?php

namespace App\Http\Resources\Event;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrinterSnapshotResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'printer_profile_id' => $this->printer_profile_id,

            'printer_name' => $this->printer_name,

            'copies' => $this->copies,

            'paper_size' => $this->paper_size,

            'orientation' => $this->orientation,

            'auto_print' => (bool) $this->auto_print,

            'border' => (bool) $this->border,

            'bleed' => (float) $this->bleed,

            'delay_ms' => $this->delay_ms,

            'version' => $this->version,
        ];
    }
}