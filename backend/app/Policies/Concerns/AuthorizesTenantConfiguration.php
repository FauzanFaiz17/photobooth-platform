<?php

namespace App\Policies\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

trait AuthorizesTenantConfiguration
{
    protected function canViewAny(User $user, string $permission): bool
    {
        return $user->hasPermission($permission);
    }

    protected function canView(
        User $user,
        Model $configuration,
        string $permission
    ): bool {
        return $user->hasPermission($permission)
            && (
                $user->isSuperAdmin()
                || $configuration->partner_id === null
                || $configuration->partner_id === $user->partner_id
            );
    }

    protected function canCreate(User $user, string $permission): bool
    {
        return $user->hasPermission($permission);
    }

    protected function canMutate(
        User $user,
        Model $configuration,
        string $permission
    ): bool {
        if (! $user->hasPermission($permission)) {
            return false;
        }

        if ($user->isSuperAdmin()) {
            return true;
        }

        return $configuration->partner_id !== null
            && $configuration->partner_id === $user->partner_id;
    }
}
