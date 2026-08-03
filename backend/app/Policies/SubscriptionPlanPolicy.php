<?php

namespace App\Policies;

use App\Models\User;
use App\Models\SubscriptionPlan;

class SubscriptionPlanPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('subscriptions.view');
    }

    public function view(User $user, SubscriptionPlan $plan): bool
    {
        return $user->hasPermission('subscriptions.view');
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function update(User $user, SubscriptionPlan $plan): bool
    {
        return $user->isSuperAdmin();
    }

    public function delete(User $user, SubscriptionPlan $plan): bool
    {
        return $user->isSuperAdmin();
    }
}