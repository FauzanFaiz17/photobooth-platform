<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'event_name' => $this->event_name,

            'event_code' => $this->event_code,

            'event_date' => $this->event_date?->format('Y-m-d'),

            'start_time' => $this->start_time,

            'end_time' => $this->end_time,

            'price' => $this->price,

            'print_count_limit' => $this->print_count_limit,

            'status' => $this->status,

            'partner' => new PartnerResource($this->whenLoaded('partner')),

            'booth' => new BoothResource($this->whenLoaded('booth')),

            'creator' => new UserResource($this->whenLoaded('creator')),

            'template_snapshot' => new TemplateSnapshotResource(
                $this->whenLoaded('templateSnapshot')
            ),

            'filter_snapshot' => new FilterSnapshotResource(
                $this->whenLoaded('filterSnapshot')
            ),

            'camera_snapshot' => new CameraSnapshotResource(
                $this->whenLoaded('cameraSnapshot')
            ),

            'printer_snapshot' => new PrinterSnapshotResource(
                $this->whenLoaded('printerSnapshot')
            ),

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}