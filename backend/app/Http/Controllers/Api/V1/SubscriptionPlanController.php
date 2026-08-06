<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Subscription\StoreSubscriptionPlanRequest;
use App\Http\Requests\Subscription\SubscriptionPlanIndexRequest;
use App\Http\Requests\Subscription\UpdateSubscriptionPlanRequest;
use App\Http\Resources\SubscriptionPlanResource;
use App\Models\SubscriptionPlan;
use App\Services\SubscriptionPlanService;
use App\Support\ApiResponse;

class SubscriptionPlanController extends Controller
{
    public function __construct(
        protected SubscriptionPlanService $service
    ) {}

    public function index(
        SubscriptionPlanIndexRequest $request
    ) {
        $this->authorize(
            'viewAny',
            SubscriptionPlan::class
        );

        return SubscriptionPlanResource::collection(
            $this->service->index(
                $request->validated()
            )
        );
    }

    public function show(
        SubscriptionPlan $subscriptionPlan
    ) {
        $this->authorize(
            'view',
            $subscriptionPlan
        );

        return new SubscriptionPlanResource(
            $this->service->show(
                $subscriptionPlan
            )
        );
    }

    public function store(
        StoreSubscriptionPlanRequest $request
    ) {
        $this->authorize(
            'create',
            SubscriptionPlan::class
        );

        return (new SubscriptionPlanResource(
            $this->service->store(
                $request->validated()
            )
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function update(
        UpdateSubscriptionPlanRequest $request,
        SubscriptionPlan $subscriptionPlan
    ) {
        $this->authorize(
            'update',
            $subscriptionPlan
        );

        return new SubscriptionPlanResource(
            $this->service->update(
                $subscriptionPlan,
                $request->validated()
            )
        );
    }

    public function destroy(
        SubscriptionPlan $subscriptionPlan
    ) {
        $this->authorize(
            'delete',
            $subscriptionPlan
        );

        $this->service->destroy(
            $subscriptionPlan
        );

        return ApiResponse::success(
            null,
            'Subscription plan deleted successfully.'
        );
    }
}
