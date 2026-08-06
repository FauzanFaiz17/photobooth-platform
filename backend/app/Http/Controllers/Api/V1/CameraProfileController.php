<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Configuration\CameraProfileRequest;
use App\Http\Requests\Configuration\ConfigurationIndexRequest;
use App\Http\Resources\CameraProfileResource;
use App\Models\CameraProfile;
use App\Services\Configuration\CameraProfileService;
use App\Support\ApiResponse;

class CameraProfileController extends Controller
{
    public function __construct(protected CameraProfileService $service) {}

    public function index(ConfigurationIndexRequest $request)
    {
        $this->authorize('viewAny', CameraProfile::class);

        return CameraProfileResource::collection(
            $this->service->index($request->validated(), $request->user())
        );
    }

    public function store(CameraProfileRequest $request)
    {
        $this->authorize('create', CameraProfile::class);

        return (new CameraProfileResource(
            $this->service->store($request->validated(), $request->user())
        ))->response()->setStatusCode(201);
    }

    public function show(CameraProfile $cameraProfile)
    {
        $this->authorize('view', $cameraProfile);

        return new CameraProfileResource($this->service->show($cameraProfile));
    }

    public function update(
        CameraProfileRequest $request,
        CameraProfile $cameraProfile
    ) {
        $this->authorize('update', $cameraProfile);

        return new CameraProfileResource(
            $this->service->update(
                $cameraProfile,
                $request->validated(),
                $request->user()
            )
        );
    }

    public function destroy(CameraProfile $cameraProfile)
    {
        $this->authorize('delete', $cameraProfile);
        $this->service->destroy($cameraProfile);

        return ApiResponse::success(
            null,
            'Camera profile deleted successfully.'
        );
    }
}
