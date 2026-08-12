<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrintJobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'partner_id' => $this->partner_id,
            'photo_session_id' => $this->photo_session_id, 'printer_id' => $this->printer_id,
            'printer_snapshot_id' => $this->printer_snapshot_id,
            'copies' => $this->copies, 'status' => $this->status,
            'duration_ms' => $this->duration_ms, 'error_log' => $this->error_log,
            'queued_at' => $this->queued_at, 'started_at' => $this->started_at,
            'finished_at' => $this->finished_at,
            'printer' => new PrinterResource($this->whenLoaded('printer')),
            'printable_media' => $this->whenLoaded('photoSession', function () {
                $media = $this->photoSession?->media?->sortByDesc('id')
                    ->first(fn ($item) => $item->type === 'template')
                    ?? $this->photoSession?->media?->sortByDesc('id')
                        ->first(fn ($item) => $item->type === 'edited');

                return $media ? [
                    'id' => $media->id,
                    'filename' => $media->filename,
                    'mime_type' => $media->mime_type,
                    'download_url' => route('desktop.print-jobs.media', $this->id),
                ] : null;
            }),
            'created_at' => $this->created_at, 'updated_at' => $this->updated_at,
        ];
    }
}
