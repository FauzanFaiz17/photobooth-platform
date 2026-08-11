<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Subscription\PartnerSubscriptionIndexRequest;
use App\Http\Requests\Subscription\RenewPartnerSubscriptionRequest;
use App\Http\Requests\Subscription\StorePartnerSubscriptionRequest;
use App\Http\Resources\PartnerSubscriptionResource;
use App\Models\PartnerSubscription;
use App\Services\PartnerSubscriptionService;

class PartnerSubscriptionController extends Controller
{
    public function __construct(protected PartnerSubscriptionService $service) {}

    public function index(PartnerSubscriptionIndexRequest $request)
    {
        $this->authorize('viewAny', PartnerSubscription::class);
        $user = $request->user();
        $partnerId = $user->isSuperAdmin() ? null : $user->partner_id;

        return PartnerSubscriptionResource::collection(
            $this->service->index($request->validated(), $partnerId)
        );
    }

    public function show(PartnerSubscription $partnerSubscription)
    {
        $this->authorize('view', $partnerSubscription);

        return new PartnerSubscriptionResource($this->service->show($partnerSubscription));
    }

    public function store(StorePartnerSubscriptionRequest $request)
    {
        $this->authorize('create', PartnerSubscription::class);

        return (new PartnerSubscriptionResource($this->service->store($request->validated())))
            ->response()
            ->setStatusCode(201);
    }

    public function activate(PartnerSubscription $partnerSubscription)
    {
        $this->authorize('update', $partnerSubscription);

        return new PartnerSubscriptionResource($this->service->activate($partnerSubscription));
    }

    public function renew(RenewPartnerSubscriptionRequest $request, PartnerSubscription $partnerSubscription)
    {
        $this->authorize('update', $partnerSubscription);

        return new PartnerSubscriptionResource(
            $this->service->renew($partnerSubscription, $request->validated())
        );
    }

    public function cancel(PartnerSubscription $partnerSubscription)
    {
        $this->authorize('update', $partnerSubscription);

        return new PartnerSubscriptionResource($this->service->cancel($partnerSubscription));
    }

    public function expire(PartnerSubscription $partnerSubscription)
    {
        $this->authorize('update', $partnerSubscription);

        return new PartnerSubscriptionResource($this->service->expire($partnerSubscription));
    }
}
