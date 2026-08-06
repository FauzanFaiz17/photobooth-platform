<?php

namespace App\Http\Controllers\Api\V1\Desktop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Desktop\EventConfigurationRequest;
use App\Http\Resources\Event\EventConfigurationResource;
use App\Services\Desktop\EventConfigurationService;
use App\Support\ApiResponse;

class EventConfigurationController extends Controller
{
    public function __construct(
        protected EventConfigurationService $eventConfigurationService
    ) {}

    public function show(
        EventConfigurationRequest $request,
        string $eventCode
    ) {
        $event = $this->eventConfigurationService->find(
            $request->user(),
            $request->deviceUuid(),
            $eventCode
        );

        return ApiResponse::success(
            new EventConfigurationResource($event),
            'Event configuration loaded.'
        );
    }
}
