<?php
namespace App\Http\Controllers\Api\V1;
use App\Http\Controllers\Controller;
use App\Http\Requests\Printer\PrinterIndexRequest;
use App\Http\Requests\Printer\StorePrinterRequest;
use App\Http\Requests\Printer\UpdatePrinterRequest;
use App\Http\Resources\PrinterResource;
use App\Models\Printer;
use App\Services\PrinterService;
use App\Support\ApiResponse;
class PrinterController extends Controller {
 public function __construct(protected PrinterService $service) {}
 public function index(PrinterIndexRequest $r){$this->authorize('viewAny',Printer::class);return PrinterResource::collection($this->service->index($r->validated(),$r->user()));}
 public function show(Printer $printer){$this->authorize('view',$printer);return new PrinterResource($printer);}
 public function store(StorePrinterRequest $r){$this->authorize('create',Printer::class);return ApiResponse::success(new PrinterResource($this->service->create($r->validated(),$r->user())),'Printer created.',201);}
 public function update(UpdatePrinterRequest $r,Printer $printer){$this->authorize('update',$printer);return new PrinterResource($this->service->update($printer,$r->validated()));}
 public function destroy(Printer $printer){$this->authorize('delete',$printer);$this->service->delete($printer);return ApiResponse::success(null,'Printer deleted.');}
}
