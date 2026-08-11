<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Device\DeviceIndexRequest;
use App\Http\Requests\Device\StoreDeviceRequest;
use App\Http\Requests\Device\UpdateDeviceRequest;
use App\Http\Resources\DeviceResource;
use App\Models\Device;
use App\Services\DeviceManagementService;
use App\Support\ApiResponse;

class DeviceController extends Controller
{
    public function __construct(
        protected DeviceManagementService $service
    ) {}

    public function index(DeviceIndexRequest $request)
    {
        $this->authorize('viewAny', Device::class);

        return DeviceResource::collection(
            $this->service->index($request->validated(), $request->user())
        );
    }

    public function show(Device $device)
    {
        $this->authorize('view', $device);

        return new DeviceResource($device->load(['partner', 'booth']));
    }

    public function store(StoreDeviceRequest $request)
    {
        $this->authorize('create', Device::class);
        [$device, $activationCode] = $this->service->create(
            $request->validated(),
            $request->user()
        );

        return ApiResponse::success([
            'device' => (new DeviceResource($device))->resolve($request),
            'activation_code' => $activationCode,
        ], 'Device created. Save the activation code now.', 201);
    }

    public function update(UpdateDeviceRequest $request, Device $device)
    {
        $this->authorize('update', $device);

        return new DeviceResource(
            $this->service->update($device, $request->validated())
        );
    }

    public function regenerateActivation(Device $device)
    {
        $this->authorize('update', $device);
        [$updatedDevice, $activationCode] = $this->service->regenerateActivation($device);

        return ApiResponse::success([
            'device' => (new DeviceResource($updatedDevice))->resolve(request()),
            'activation_code' => $activationCode,
        ], 'A new activation code was generated.');
    }

    public function destroy(Device $device)
    {
        $this->authorize('delete', $device);
        $this->service->delete($device);

        return ApiResponse::success(null, 'Device deleted successfully.');
    }
}
