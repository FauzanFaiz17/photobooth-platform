<?php

namespace App\Http\Resources\Event;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventConfigurationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            'event' => [

                'id' => $this->id,

                'event_name' => $this->event_name,

                'event_code' => $this->event_code,

                'event_date' => $this->event_date,

                'start_time' => $this->start_time,

                'end_time' => $this->end_time,

                'price' => (float) $this->price,

                'print_count_limit' => $this->print_count_limit,

            ],

            'template' => new TemplateSnapshotResource(
                $this->whenLoaded('templateSnapshot')
            ),

            'filter' => new FilterSnapshotResource(
                $this->whenLoaded('filterSnapshot')
            ),

            'camera' => new CameraSnapshotResource(
                $this->whenLoaded('cameraSnapshot')
            ),

            'printer' => new PrinterSnapshotResource(
                $this->whenLoaded('printerSnapshot')
            ),
        ];
    }
}