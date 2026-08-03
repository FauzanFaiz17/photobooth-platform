<?php

namespace App\Services;

use App\Models\SubscriptionPlan;
use Illuminate\Support\Facades\DB;

class SubscriptionPlanService
{
    /**
     * List Subscription Plan
     */
    public function index(array $filters)
    {
        $query = SubscriptionPlan::query();

        if (!empty($filters['search'])) {

            $query->where('name', 'like', "%{$filters['search']}%");
        }

        if (isset($filters['is_active'])) {

            $query->where(
                'is_active',
                $filters['is_active']
            );
        }

        return $query
            ->orderBy(
                $filters['sort'] ?? 'created_at',
                $filters['direction'] ?? 'desc'
            )
            ->paginate(
                $filters['per_page'] ?? 10
            );
    }

    /**
     * Detail Subscription Plan
     */
    public function show(
        SubscriptionPlan $plan
    ): SubscriptionPlan
    {
        return $plan;
    }

    /**
     * Store Subscription Plan
     */
    public function store(array $data): SubscriptionPlan
    {
        return DB::transaction(function () use ($data) {

            return SubscriptionPlan::create($data);

        });
    }

    /**
     * Update Subscription Plan
     */
    public function update(
        SubscriptionPlan $plan,
        array $data
    ): SubscriptionPlan
    {
        return DB::transaction(function () use ($plan, $data) {

            $plan->update($data);

            return $plan->fresh();

        });
    }

    /**
     * Delete Subscription Plan
     */
    public function destroy(
        SubscriptionPlan $plan
    ): void
    {
        DB::transaction(function () use ($plan) {

            if ($plan->partnerSubscriptions()->exists()) {

                abort(
                    422,
                    'Subscription plan is already used.'
                );

            }

            $plan->delete();

        });
    }
}