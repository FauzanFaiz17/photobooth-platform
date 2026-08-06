<?php

namespace App\Policies;

use App\Models\Booth;
use App\Models\User;

class BoothPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user)
    {
        return $user->hasPermission('booths.view');
    }

    public function view(User $user, Booth $booth)
    {
        if (! $user->hasPermission('booths.view')) {
            return false;
        }

        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->partner_id === $booth->partner_id;
    }

    public function create(User $user)
    {
        return $user->hasPermission('booths.create');
    }

    public function update(User $user, Booth $booth)
    {
        if (! $user->hasPermission('booths.update')) {
            return false;
        }

        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->partner_id === $booth->partner_id;
    }

    public function delete(User $user, Booth $booth)
    {
        if (! $user->hasPermission('booths.delete')) {
            return false;
        }

        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->partner_id === $booth->partner_id;
    }
}
