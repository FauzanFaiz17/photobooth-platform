<?php

namespace App\Services\Snapshots;

use App\Models\CameraProfile;
use App\Models\Filter;
use App\Models\PrinterProfile;
use App\Models\Template;

class SnapshotService
{
    public function __construct(
        protected TemplateSnapshotService $templateSnapshotService,
        protected FilterSnapshotService $filterSnapshotService,
        protected CameraSnapshotService $cameraSnapshotService,
        protected PrinterSnapshotService $printerSnapshotService,
    ) {}

    public function create(
        Template $template,
        Filter $filter,
        CameraProfile $camera,
        PrinterProfile $printer
    ): array {

        $templateSnapshot = $this->templateSnapshotService->create($template);

        $filterSnapshot = $this->filterSnapshotService->create($filter);

        $cameraSnapshot = $this->cameraSnapshotService->create($camera);

        $printerSnapshot = $this->printerSnapshotService->create($printer);

        return [
            'template_snapshot_id' => $templateSnapshot->id,
            'filter_snapshot_id'   => $filterSnapshot->id,
            'camera_snapshot_id'   => $cameraSnapshot->id,
            'printer_snapshot_id'  => $printerSnapshot->id,
        ];
    }

    public function createTemplate(Template $template): int
    {
        return $this->templateSnapshotService->create($template)->id;
    }

    public function createFilter(Filter $filter): int
    {
        return $this->filterSnapshotService->create($filter)->id;
    }
}
