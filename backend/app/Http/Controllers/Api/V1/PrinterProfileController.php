<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Configuration\ConfigurationIndexRequest;
use App\Http\Requests\Configuration\PrinterProfileRequest;
use App\Http\Resources\PrinterProfileResource;
use App\Models\PrinterProfile;
use App\Services\Configuration\PrinterProfileService;
use App\Support\ApiResponse;

class PrinterProfileController extends Controller
{
    public function __construct(protected PrinterProfileService $service) {}

    public function index(ConfigurationIndexRequest $request)
    {
        $this->authorize('viewAny', PrinterProfile::class);

        return PrinterProfileResource::collection(
            $this->service->index($request->validated(), $request->user())
        );
    }

    public function store(PrinterProfileRequest $request)
    {
        $this->authorize('create', PrinterProfile::class);

        return (new PrinterProfileResource(
            $this->service->store($request->validated(), $request->user())
        ))->response()->setStatusCode(201);
    }

    public function show(PrinterProfile $printerProfile)
    {
        $this->authorize('view', $printerProfile);

        return new PrinterProfileResource(
            $this->service->show($printerProfile)
        );
    }

    public function update(
        PrinterProfileRequest $request,
        PrinterProfile $printerProfile
    ) {
        $this->authorize('update', $printerProfile);

        return new PrinterProfileResource(
            $this->service->update(
                $printerProfile,
                $request->validated(),
                $request->user()
            )
        );
    }

    public function destroy(PrinterProfile $printerProfile)
    {
        $this->authorize('delete', $printerProfile);
        $this->service->destroy($printerProfile);

        return ApiResponse::success(
            null,
            'Printer profile deleted successfully.'
        );
    }
}
