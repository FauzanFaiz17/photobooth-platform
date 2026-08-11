<?php

namespace App\Http\Controllers\Api\V1\Desktop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Desktop\ActivateDeviceRequest;
use App\Http\Requests\Desktop\DeviceVerifyRequest;
use App\Http\Resources\DeviceResource;
use App\Services\Desktop\DeviceActivationService;
use App\Services\Desktop\DeviceService;
use App\Support\ApiResponse;

class DeviceController extends Controller
{
    public function __construct(
        protected DeviceService $deviceService,
        protected DeviceActivationService $activationService
    ) {}

    public function activate(ActivateDeviceRequest $request)
    {
        return ApiResponse::success(
            new DeviceResource(
                $this->activationService->activate($request->validated())
            ),
            'Device activated successfully.'
        );
    }

    public function verify(DeviceVerifyRequest $request)
    {
        $device = $this->deviceService->findByUuid(
            $request->device_uuid
        );

        if (! $device) {

            return ApiResponse::error(
                'Perangkat belum terdaftar.',
                null,
                404
            );

        }

        if ($device->status !== 'active') {

            return ApiResponse::error(
                'Perangkat tidak aktif.',
                null,
                403
            );

        }

        return ApiResponse::success(

            new DeviceResource($device),

            'Perangkat berhasil diverifikasi.'

        );
    }
}
