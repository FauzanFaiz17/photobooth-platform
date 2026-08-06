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

            'price' => (float) $this->price,

            'print_count_limit' => $this->print_count_limit,

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
                    'filter' => new FilterSnapshotResource(
                        $this->filterSnapshot
                    ),
                    'camera' => new CameraSnapshotResource(
                        $this->cameraSnapshot
                    ),
                    'printer' => new PrinterSnapshotResource(
                        $this->printerSnapshot
                    ),
                ]
            ),
        ];
    }
}
