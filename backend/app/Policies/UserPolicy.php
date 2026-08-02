<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    /**
     * Super Admin selalu boleh.
     */
    protected function isSuperAdmin(User $user): bool
    {
        return $user->role?->slug === 'super-admin';
    }

    /**
     * Apakah dua user berasal dari partner yang sama?
     */
    protected function samePartner(User $user, User $target): bool
    {
        return $user->partner_id === $target->partner_id;
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('users.view');
    }

    public function view(User $user, User $target): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $this->samePartner($user, $target);
    }



    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('users.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $target): bool
    {
        return $user->hasPermission('users.update')
            && $user->canManageUser($target);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, User $target): bool
    {
        return $user->hasPermission('users.delete')
            && $user->canManageUser($target);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, User $model): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, User $model): bool
    {
        return false;
    }
}
