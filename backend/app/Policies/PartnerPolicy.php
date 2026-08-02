<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Partner;

class PartnerPolicy
{
    /**
     * List Partner
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(
            'partners.view'
        );
    }

    /**
     * Detail Partner
     */
    public function view(
        User $user,
        Partner $partner
    ): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->partner_id === $partner->id;
    }

    /**
     * Create Partner
     */
    public function create(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    /**
     * Update Partner
     */
    public function update(
        User $user,
        Partner $partner
    ): bool
    {
        return $user->isSuperAdmin();
    }

    /**
     * Delete Partner
     */
    public function delete(
        User $user,
        Partner $partner
    ): bool
    {
        return $user->isSuperAdmin();
    }
}