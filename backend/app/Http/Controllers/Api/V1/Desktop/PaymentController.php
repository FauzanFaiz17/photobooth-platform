<?php

namespace App\Http\Controllers\Api\V1\Desktop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Desktop\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\AuditService;
use App\Services\PaymentService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(protected PaymentService $service, protected AuditService $auditService) {}

    public function store(StorePaymentRequest $request)
    {
        $payment = $this->service->createForDesktop($request->user(), $request->validated());
        $this->auditService->record('payment', $request->user(), $payment, 'Desktop payment created.', [
            'gateway' => $payment->gateway, 'status' => $payment->status, 'amount' => $payment->amount,
        ]);

        return ApiResponse::success(
            new PaymentResource($payment),
            'Payment created.',
            201
        );
    }

    public function show(Payment $payment, Request $request)
    {
        abort_unless($payment->partner_id === $request->user()->partner_id, 404);

        return ApiResponse::success(new PaymentResource($this->service->refreshGatewayStatus($payment)), 'Payment status retrieved.');
    }
}
