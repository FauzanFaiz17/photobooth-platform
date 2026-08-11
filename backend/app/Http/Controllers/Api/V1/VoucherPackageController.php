<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Voucher\VoucherPackageIndexRequest;
use App\Http\Requests\Voucher\VoucherPackageRequest;
use App\Http\Resources\VoucherPackageResource;
use App\Models\VoucherPackage;
use App\Services\VoucherPackageService;
use App\Support\ApiResponse;

class VoucherPackageController extends Controller
{
    public function __construct(protected VoucherPackageService $service) {}

    public function index(VoucherPackageIndexRequest $request)
    {
        $this->authorize('viewAny', VoucherPackage::class);

        return VoucherPackageResource::collection(
            $this->service->index($request->validated(), $request->user())
        );
    }

    public function store(VoucherPackageRequest $request)
    {
        $this->authorize('create', VoucherPackage::class);

        return (new VoucherPackageResource(
            $this->service->store($request->validated(), $request->user())
        ))->response()->setStatusCode(201);
    }

    public function show(VoucherPackage $voucherPackage)
    {
        $this->authorize('view', $voucherPackage);

        return new VoucherPackageResource($voucherPackage->loadCount('vouchers'));
    }

    public function update(VoucherPackageRequest $request, VoucherPackage $voucherPackage)
    {
        $this->authorize('update', $voucherPackage);

        return new VoucherPackageResource(
            $this->service->update($voucherPackage, $request->validated(), $request->user())
        );
    }

    public function destroy(VoucherPackage $voucherPackage)
    {
        $this->authorize('delete', $voucherPackage);
        $this->service->destroy($voucherPackage);

        return ApiResponse::success(null, 'Voucher package deleted successfully.');
    }
}
