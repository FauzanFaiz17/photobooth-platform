<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PrintJob\PrintJobIndexRequest;
use App\Http\Requests\PrintJob\StorePrintJobRequest;
use App\Http\Requests\PrintJob\TransitionPrintJobRequest;
use App\Http\Resources\PrintJobResource;
use App\Models\PrintJob;
use App\Services\AuditService;
use App\Services\PrintJobService;
use App\Support\ApiResponse;

class PrintJobController extends Controller
{
    public function __construct(
        protected PrintJobService $service,
        protected AuditService $auditService
    ) {}

    public function index(PrintJobIndexRequest $request)
    {
        $this->authorize('viewAny', PrintJob::class);

        return PrintJobResource::collection($this->service->index($request->validated(), $request->user()));
    }

    public function show(PrintJob $printJob)
    {
        $this->authorize('view', $printJob);

        return new PrintJobResource($printJob->load('printer'));
    }

    public function store(StorePrintJobRequest $request)
    {
        $this->authorize('create', PrintJob::class);

        return ApiResponse::success(
            new PrintJobResource($this->service->create($request->validated(), $request->user())),
            'Print job queued.',
            201
        );
    }

    public function transition(TransitionPrintJobRequest $request, PrintJob $printJob)
    {
        $this->authorize('update', $printJob);
        $previousStatus = $printJob->status;
        $updated = $this->service->transition(
            $printJob,
            $request->validated('status'),
            $request->validated()
        );
        $this->auditService->record('print', $request->user(), $updated, 'Print job status updated by management.', [
            'from' => $previousStatus,
            'to' => $updated->status,
        ]);

        return new PrintJobResource($updated);
    }

    public function retry(PrintJob $printJob)
    {
        $this->authorize('update', $printJob);
        $previousStatus = $printJob->status;
        $updated = $this->service->transition($printJob, 'queued');
        $this->auditService->record('print', request()->user(), $updated, 'Print job retried by management.', [
            'from' => $previousStatus,
            'to' => 'queued',
        ]);

        return new PrintJobResource($updated);
    }
}
