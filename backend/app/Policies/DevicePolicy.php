<?php

namespace App\Policies;

use App\Models\Device;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class DevicePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user)
    {
        return $user->hasPermission('devices.view');
    }

    public function view(User $user, Device $device)
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->partner_id === $device->partner_id;
    }

    public function create(User $user)
    {
        return $user->hasPermission('devices.create');
    }

    public function update(User $user, Device $device)
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->partner_id === $device->partner_id;
    }

    public function delete(User $user, Device $device)
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->partner_id === $device->partner_id;
    }
}
