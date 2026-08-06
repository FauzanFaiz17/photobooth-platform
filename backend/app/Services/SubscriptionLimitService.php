<?php

namespace App\Services;

use App\Models\Partner;
use Illuminate\Validation\ValidationException;

class SubscriptionLimitService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function activeSubscription(Partner $partner)
    {
        return $partner
            ->activeSubscription()
            ->with('subscriptionPlan')
            ->first();
    }

    public function currentPlan(Partner $partner)
    {
        return optional(
            $this->activeSubscription($partner)
        )->subscriptionPlan;
    }

    public function remainingDays(
        Partner $partner
    ): int {

        $subscription = $this->activeSubscription(
            $partner
        );

        if (! $subscription) {

            return 0;

        }

        return now()->diffInDays(
            $subscription->ends_at,
            false
        );

    }

    public function isExpired(
        Partner $partner
    ): bool {

        $subscription = $this->activeSubscription(
            $partner
        );

        if (! $subscription) {

            return true;

        }

        return now()->greaterThan(
            $subscription->ends_at
        );

    }

    public function ensureSubscriptionIsActive(
        Partner $partner
    ): void {
        $subscription = $this->activeSubscription($partner);

        if (! $subscription) {

            throw ValidationException::withMessages([
                'subscription' => 'Partner does not have an active subscription.',
            ]);
        }

        if ($subscription->status !== 'active') {

            throw ValidationException::withMessages([
                'subscription' => 'Subscription is not active.',
            ]);
        }

        if ($subscription->ends_at->isPast()) {

            throw ValidationException::withMessages([
                'subscription' => 'Subscription has expired.',
            ]);
        }
    }

    public function boothUsage(Partner $partner): array
    {
        $plan = $this->currentPlan($partner);

        if (! $plan) {
            return [
                'used' => 0,
                'limit' => 0,
                'remaining' => 0,
            ];
        }

        $used = $partner->booths()->count();

        return [

            'used' => $used,

            'limit' => $plan->max_booths,

            'remaining' => max(
                0,
                $plan->max_booths - $used
            ),

        ];
    }

    public function ensureCanCreateBooth(
        Partner $partner
    ): void {
        $this->ensureSubscriptionIsActive($partner);

        $usage = $this->boothUsage($partner);

        if ($usage['used'] >= $usage['limit']) {

            throw ValidationException::withMessages([
                'booth' => 'Maximum booth limit reached.',

            ]);
        }
    }

    public function ensureCanCreateEvent(Partner $partner): void
    {
        $this->ensureSubscriptionIsActive($partner);
    }
}
