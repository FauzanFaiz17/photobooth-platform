<?php
namespace App\Http\Controllers\Api\V1\Desktop;
use App\Contracts\MediaStorage;
use App\Http\Controllers\Controller;
use App\Http\Requests\Desktop\PollPrintJobsRequest;
use App\Http\Requests\Desktop\UpdatePrintJobRequest;
use App\Http\Resources\PrintJobResource;
use App\Models\PrintJob;
use App\Services\PrintJobService;
use App\Support\ApiResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
class PrintJobController extends Controller {
 public function __construct(protected PrintJobService $service, protected MediaStorage $storage) {}
 public function index(PollPrintJobsRequest $r){return ApiResponse::success(PrintJobResource::collection($this->service->poll($r->user(),$r->validated())),'Print queue retrieved.');}
 public function update(UpdatePrintJobRequest $r,PrintJob $printJob){return ApiResponse::success(new PrintJobResource($this->service->transitionForDesktop($printJob,$r->user(),$r->validated())),'Print job updated.');}
 public function media(PollPrintJobsRequest $r,PrintJob $printJob): StreamedResponse {
  $media=$this->service->printableMedia($printJob,$r->user(),$r->validated('device_uuid'));
  $stream=$this->storage->readStream($media->object_key);
  if($stream===false) abort(404,'Printable media file is unavailable.');
  return response()->streamDownload(function() use($stream){fpassthru($stream);fclose($stream);},$media->filename,['Content-Type'=>$media->mime_type,'Content-Length'=>(string)$media->size_bytes,'Cache-Control'=>'private, no-store']);
 }
}
