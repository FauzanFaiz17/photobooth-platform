<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\PaymentIndexRequest;
use App\Http\Requests\Payment\TransitionPaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\AuditService;
use App\Services\PaymentService;

class PaymentController extends Controller
{
    public function __construct(protected PaymentService $service, protected AuditService $auditService) {}

    public function index(PaymentIndexRequest $request)
    {
        $this->authorize('viewAny', Payment::class);

        return PaymentResource::collection(
            $this->service->index($request->validated(), $request->user())
        );
    }

    public function show(Payment $payment)
    {
        $this->authorize('view', $payment);

        return new PaymentResource($payment->load('voucher'));
    }

    public function transition(TransitionPaymentRequest $request, Payment $payment)
    {
        $this->authorize('update', $payment);

        $previousStatus = $payment->status;
        $updated = $this->service->transition(
            $payment,
            $request->validated('status'),
            $request->validated('gateway_response')
        );
        $this->auditService->record('payment', $request->user(), $updated, 'Payment status transitioned.', [
            'from' => $previousStatus, 'to' => $updated->status,
        ]);

        return new PaymentResource($updated);
    }
}
