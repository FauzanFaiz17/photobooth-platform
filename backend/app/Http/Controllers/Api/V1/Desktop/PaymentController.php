<?php

namespace App\Http\Controllers\Api\V1\Desktop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Desktop\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Services\PaymentService;
use App\Support\ApiResponse;

class PaymentController extends Controller
{
    public function __construct(protected PaymentService $service) {}

    public function store(StorePaymentRequest $request)
    {
        return ApiResponse::success(
            new PaymentResource(
                $this->service->createForDesktop($request->user(), $request->validated())
            ),
            'Payment created.',
            201
        );
    }
}
