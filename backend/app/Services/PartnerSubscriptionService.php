<?php

namespace App\Services;

use App\Models\Partner;
use App\Models\PartnerSubscription;
use App\Models\SubscriptionPlan;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PartnerSubscriptionService
{
    public function index(array $filters, ?int $partnerId = null): LengthAwarePaginator
    {
        $query = PartnerSubscription::query()
            ->with(['partner', 'subscriptionPlan']);

        if ($partnerId !== null) {
            $query->where('partner_id', $partnerId);
        } elseif (! empty($filters['partner_id'])) {
            $query->where('partner_id', $filters['partner_id']);
        }

        if (! empty($filters['subscription_plan_id'])) {
            $query->where('subscription_plan_id', $filters['subscription_plan_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query
            ->orderBy($filters['sort'] ?? 'starts_at', $filters['direction'] ?? 'desc')
            ->paginate($filters['per_page'] ?? 10);
    }

    public function show(PartnerSubscription $subscription): PartnerSubscription
    {
        return $subscription->load(['partner', 'subscriptionPlan']);
    }

    public function store(array $data): PartnerSubscription
    {
        return DB::transaction(function () use ($data) {
            $partner = Partner::query()->findOrFail($data['partner_id']);
            $plan = $this->activePlan($data['subscription_plan_id']);
            $startsAt = isset($data['starts_at'])
                ? Carbon::parse($data['starts_at'])
                : now();
            $endsAt = isset($data['ends_at'])
                ? Carbon::parse($data['ends_at'])
                : $this->periodEnd($startsAt, $plan, 1);
            $status = $data['status'] ?? 'pending';

            $this->validatePeriod($startsAt, $endsAt);

            if ($status === 'active') {
                $this->ensureNoActiveOverlap($partner->id, $startsAt, $endsAt);
            }

            return PartnerSubscription::create([
                'partner_id' => $partner->id,
                'subscription_plan_id' => $plan->id,
                'status' => $status,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'auto_renew' => $data['auto_renew'] ?? true,
            ])->load(['partner', 'subscriptionPlan']);
        });
    }

    public function activate(PartnerSubscription $subscription): PartnerSubscription
    {
        return DB::transaction(function () use ($subscription) {
            $subscription = PartnerSubscription::query()
                ->with('subscriptionPlan')
                ->lockForUpdate()
                ->findOrFail($subscription->id);

            if ($subscription->status !== 'pending') {
                throw ValidationException::withMessages([
                    'status' => 'Only pending subscriptions can be activated.',
                ]);
            }

            if ($subscription->starts_at->isFuture() || $subscription->ends_at->isPast()) {
                throw ValidationException::withMessages([
                    'period' => 'The subscription period must include the current time.',
                ]);
            }

            $this->ensureNoActiveOverlap(
                $subscription->partner_id,
                $subscription->starts_at,
                $subscription->ends_at,
                $subscription->id
            );

            $subscription->update(['status' => 'active', 'cancelled_at' => null]);

            return $subscription->fresh()->load(['partner', 'subscriptionPlan']);
        });
    }

    public function renew(
        PartnerSubscription $subscription,
        array $data
    ): PartnerSubscription {
        return DB::transaction(function () use ($subscription, $data) {
            $subscription = PartnerSubscription::query()
                ->with('subscriptionPlan')
                ->lockForUpdate()
                ->findOrFail($subscription->id);

            if (! in_array($subscription->status, ['active', 'expired'], true)) {
                throw ValidationException::withMessages([
                    'status' => 'Only active or expired subscriptions can be renewed.',
                ]);
            }

            $requestedPlanId = $data['subscription_plan_id'] ?? $subscription->subscription_plan_id;

            if ($subscription->status === 'active'
                && $requestedPlanId !== $subscription->subscription_plan_id) {
                throw ValidationException::withMessages([
                    'subscription_plan_id' => 'An active subscription must be renewed with its current plan.',
                ]);
            }

            $plan = $this->activePlan($requestedPlanId);
            $periods = $data['periods'] ?? 1;
            $startsAt = $subscription->status === 'active' && $subscription->ends_at->isFuture()
                ? $subscription->starts_at
                : now();
            $baseEnd = $subscription->status === 'active' && $subscription->ends_at->isFuture()
                ? $subscription->ends_at
                : now();
            $endsAt = $this->periodEnd($baseEnd, $plan, $periods);

            $this->ensureNoActiveOverlap(
                $subscription->partner_id,
                $startsAt,
                $endsAt,
                $subscription->id
            );

            $subscription->update([
                'subscription_plan_id' => $plan->id,
                'status' => 'active',
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'auto_renew' => $data['auto_renew'] ?? $subscription->auto_renew,
                'cancelled_at' => null,
            ]);

            return $subscription->fresh()->load(['partner', 'subscriptionPlan']);
        });
    }

    public function cancel(PartnerSubscription $subscription): PartnerSubscription
    {
        return DB::transaction(function () use ($subscription) {
            $subscription = PartnerSubscription::query()->lockForUpdate()->findOrFail($subscription->id);
            $now = now();

            if (in_array($subscription->status, ['cancelled', 'expired'], true)) {
                throw ValidationException::withMessages([
                    'status' => 'The subscription is already closed.',
                ]);
            }

            $subscription->update([
                'status' => 'cancelled',
                'auto_renew' => false,
                'cancelled_at' => $now,
                'ends_at' => $subscription->ends_at->isBefore($now)
                    ? $subscription->ends_at
                    : $now,
            ]);

            return $subscription->fresh()->load(['partner', 'subscriptionPlan']);
        });
    }

    public function expire(PartnerSubscription $subscription): PartnerSubscription
    {
        return DB::transaction(function () use ($subscription) {
            $subscription = PartnerSubscription::query()->lockForUpdate()->findOrFail($subscription->id);
            $now = now();

            if ($subscription->status !== 'active') {
                throw ValidationException::withMessages([
                    'status' => 'Only active subscriptions can be expired.',
                ]);
            }

            $subscription->update([
                'status' => 'expired',
                'auto_renew' => false,
                'ends_at' => $subscription->ends_at->isBefore($now)
                    ? $subscription->ends_at
                    : $now,
            ]);

            return $subscription->fresh()->load(['partner', 'subscriptionPlan']);
        });
    }

    public function expireDue(): int
    {
        return PartnerSubscription::query()
            ->where('status', 'active')
            ->where('ends_at', '<=', now())
            ->update([
                'status' => 'expired',
                'auto_renew' => false,
                'updated_at' => now(),
            ]);
    }

    private function activePlan(int $planId): SubscriptionPlan
    {
        $plan = SubscriptionPlan::query()
            ->whereKey($planId)
            ->where('is_active', true)
            ->first();

        if (! $plan) {
            throw ValidationException::withMessages([
                'subscription_plan_id' => 'The subscription plan is not active.',
            ]);
        }

        return $plan;
    }

    private function periodEnd(Carbon $start, SubscriptionPlan $plan, int $periods): Carbon
    {
        return $plan->billing_cycle === 'yearly'
            ? $start->copy()->addYears($periods)
            : $start->copy()->addMonths($periods);
    }

    private function validatePeriod(Carbon $startsAt, Carbon $endsAt): void
    {
        if ($endsAt->lte($startsAt)) {
            throw ValidationException::withMessages([
                'ends_at' => 'The subscription end must be after its start.',
            ]);
        }
    }

    private function ensureNoActiveOverlap(
        int $partnerId,
        Carbon $startsAt,
        Carbon $endsAt,
        ?int $ignoreId = null
    ): void {
        $overlap = PartnerSubscription::query()
            ->where('partner_id', $partnerId)
            ->where('status', 'active')
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->lockForUpdate()
            ->exists();

        if ($overlap) {
            throw ValidationException::withMessages([
                'period' => 'The partner already has an overlapping active subscription.',
            ]);
        }
    }
}
