<?php

namespace App\Http\Controllers\Api\V1\Desktop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Desktop\RedeemVoucherRequest;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\VoucherResource;
use App\Services\VoucherService;
use App\Support\ApiResponse;

class VoucherController extends Controller
{
    public function __construct(protected VoucherService $service) {}

    public function redeem(RedeemVoucherRequest $request)
    {
        $result = $this->service->redeem($request->user(), $request->validated());

        return ApiResponse::success([
            'voucher' => (new VoucherResource($result['voucher']))->resolve($request),
            'payment' => (new PaymentResource($result['payment']))->resolve($request),
        ], 'Voucher redeemed successfully.');
    }
}
