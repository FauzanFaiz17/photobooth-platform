<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\MidtransNotificationRequest;
use App\Services\PaymentService;
use App\Support\ApiResponse;

class MidtransNotificationController extends Controller
{
    public function __construct(protected PaymentService $service) {}

    public function store(MidtransNotificationRequest $request)
    {
        $payment = $this->service->handleMidtransNotification($request->validated());

        return ApiResponse::success([
            'reference' => $payment->reference,
            'status' => $payment->status,
        ], 'Midtrans notification processed.');
    }
}
