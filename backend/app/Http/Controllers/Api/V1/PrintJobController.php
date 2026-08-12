<?php
namespace App\Http\Controllers\Api\V1;
use App\Http\Controllers\Controller;
use App\Http\Requests\PrintJob\PrintJobIndexRequest;
use App\Http\Requests\PrintJob\StorePrintJobRequest;
use App\Http\Requests\PrintJob\TransitionPrintJobRequest;
use App\Http\Resources\PrintJobResource;
use App\Models\PrintJob;
use App\Services\PrintJobService;
use App\Support\ApiResponse;
class PrintJobController extends Controller {
 public function __construct(protected PrintJobService $service) {}
 public function index(PrintJobIndexRequest $r){$this->authorize('viewAny',PrintJob::class);return PrintJobResource::collection($this->service->index($r->validated(),$r->user()));}
 public function show(PrintJob $printJob){$this->authorize('view',$printJob);return new PrintJobResource($printJob->load('printer'));}
 public function store(StorePrintJobRequest $r){$this->authorize('create',PrintJob::class);return ApiResponse::success(new PrintJobResource($this->service->create($r->validated(),$r->user())),'Print job queued.',201);}
 public function transition(TransitionPrintJobRequest $r,PrintJob $printJob){$this->authorize('update',$printJob);return new PrintJobResource($this->service->transition($printJob,$r->validated('status'),$r->validated()));}
 public function retry(PrintJob $printJob){$this->authorize('update',$printJob);return new PrintJobResource($this->service->transition($printJob,'queued'));}
}
