<?php

namespace App\Policies;

use App\Models\PartnerSubscription;
use App\Models\User;

class PartnerSubscriptionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('subscriptions.view');
    }

    public function view(User $user, PartnerSubscription $subscription): bool
    {
        return $user->isSuperAdmin()
            || ($user->partner_id === $subscription->partner_id
                && $user->hasPermission('subscriptions.view'));
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function update(User $user, PartnerSubscription $subscription): bool
    {
        return $user->isSuperAdmin();
    }
}
