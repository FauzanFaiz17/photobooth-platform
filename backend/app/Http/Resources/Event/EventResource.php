<?php

namespace App\Http\Resources\Event;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'event_name' => $this->event_name,

            'event_code' => $this->event_code,

            'event_date' => $this->event_date,

            'start_time' => $this->start_time,

            'end_time' => $this->end_time,

            'print_count_limit' => $this->print_count_limit,

            'payment_mode' => $this->payment_mode ?? 'full',

            'video_enabled' => $this->video_enabled ?? true,

            'gif_enabled' => $this->gif_enabled ?? true,

            'status' => $this->status,

            'partner' => [
                'id' => $this->partner?->id,
                'company_name' => $this->partner?->company_name,
            ],

            'booth' => [
                'id' => $this->booth?->id,
                'name' => $this->booth?->name,
            ],

            'created_by' => [
                'id' => $this->creator?->id,
                'name' => $this->creator?->name,
            ],

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,

            'configuration' => $this->when(
                $this->relationLoaded('templateSnapshot')
                && $this->relationLoaded('filterSnapshot')
                && $this->relationLoaded('cameraSnapshot')
                && $this->relationLoaded('printerSnapshot'),
                fn () => [
                    'template' => new TemplateSnapshotResource(
                        $this->templateSnapshot
                    ),
                    'templates' => TemplateSnapshotResource::collection($this->whenLoaded('templateSnapshots')),
                    'filter' => new FilterSnapshotResource(
                        $this->filterSnapshot
                    ),
                    'filters' => FilterSnapshotResource::collection($this->whenLoaded('filterSnapshots')),
                    'print_options' => $this->whenLoaded('printOptions'),
                    'camera' => new CameraSnapshotResource(
                        $this->cameraSnapshot
                    ),
                    'printer' => new PrinterSnapshotResource(
                        $this->printerSnapshot
                    ),
                    'gif_template' => new TemplateSnapshotResource(
                        $this->whenLoaded('gifTemplateSnapshot')
                    ),
                ]
            ),
        ];
    }
}
