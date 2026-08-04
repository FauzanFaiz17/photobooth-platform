<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EventPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('events.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Event $event): bool
    {
        return $this->isSuperAdmin($user)
            || (
                $this->samePartner($user, $event)
                && $user->hasPermission('events.view')
            );
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('events.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Event $event): bool
    {
        return $this->isSuperAdmin($user)
            || (
                $this->samePartner($user, $event)
                && $user->hasPermission('events.update')
            );
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Event $event): bool
    {
        return $this->isSuperAdmin($user)
            || (
                $this->samePartner($user, $event)
                && $user->hasPermission('events.delete')
            );
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Event $event): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Event $event): bool
    {
        return false;
    }

    /**
     * Check if user is Super Admin.
     */
    protected function isSuperAdmin(User $user): bool
    {
        return $user->role?->slug === 'super-admin';
    }

    /**
     * Check if user belongs to same partner.
     */
    protected function samePartner(User $user, Event $event): bool
    {
        return $user->partner_id === $event->partner_id;
    }
}