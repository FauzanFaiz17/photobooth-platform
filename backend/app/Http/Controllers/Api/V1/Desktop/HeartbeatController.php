<?php

namespace App\Http\Controllers\Api\V1\Desktop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Desktop\HeartbeatRequest;
use App\Http\Resources\DeviceResource;
use App\Services\Desktop\DeviceHeartbeatService;
use App\Support\ApiResponse;

class HeartbeatController extends Controller
{
    public function __construct(protected DeviceHeartbeatService $service) {}

    public function store(HeartbeatRequest $request)
    {
        return ApiResponse::success(
            new DeviceResource(
                $this->service->record($request->user(), $request->validated())
            ),
            'Device heartbeat recorded.'
        );
    }
}
