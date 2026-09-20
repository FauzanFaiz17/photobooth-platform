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

                'status' => $this->status,

                'event_date' => $this->event_date,

                'start_time' => $this->start_time,

                'end_time' => $this->end_time,

                'print_options' => $this->whenLoaded('printOptions'),

                'print_count_limit' => $this->print_count_limit,

                'payment_mode' => $this->payment_mode ?? 'full',

                'video_enabled' => $this->video_enabled ?? true,

                'gif_enabled' => $this->gif_enabled ?? true,

                'partner' => [
                    'id' => $this->partner?->id,
                    'company_name' => $this->partner?->company_name,
                ],

                'booth' => [
                    'id' => $this->booth?->id,
                    'name' => $this->booth?->name,
                ],

            ],

            'template' => new TemplateSnapshotResource(
                $this->whenLoaded('templateSnapshot')
            ),
            'templates' => TemplateSnapshotResource::collection($this->whenLoaded('templateSnapshots')),

            'filter' => new FilterSnapshotResource(
                $this->whenLoaded('filterSnapshot')
            ),
            'filters' => FilterSnapshotResource::collection($this->whenLoaded('filterSnapshots')),

            'camera' => new CameraSnapshotResource(
                $this->whenLoaded('cameraSnapshot')
            ),

            'printer' => new PrinterSnapshotResource(
                $this->whenLoaded('printerSnapshot')
            ),

            'gif_template' => new TemplateSnapshotResource(
                $this->whenLoaded('gifTemplateSnapshot')
            ),
        ];
    }
}
