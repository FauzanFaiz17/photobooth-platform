<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Voucher\IssueVoucherRequest;
use App\Http\Requests\Voucher\VoucherIndexRequest;
use App\Http\Resources\VoucherResource;
use App\Models\Voucher;
use App\Services\VoucherService;

class VoucherController extends Controller
{
    public function __construct(protected VoucherService $service) {}

    public function index(VoucherIndexRequest $request)
    {
        $this->authorize('viewAny', Voucher::class);

        return VoucherResource::collection(
            $this->service->index($request->validated(), $request->user())
        );
    }

    public function store(IssueVoucherRequest $request)
    {
        $this->authorize('create', Voucher::class);

        return (new VoucherResource(
            $this->service->issue($request->validated(), $request->user())
        ))->response()->setStatusCode(201);
    }

    public function show(Voucher $voucher)
    {
        $this->authorize('view', $voucher);

        return new VoucherResource($voucher->load(['package', 'payment']));
    }

    public function void(Voucher $voucher)
    {
        $this->authorize('update', $voucher);

        return new VoucherResource($this->service->void($voucher));
    }
}
