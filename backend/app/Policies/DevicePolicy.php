<?php

namespace App\Policies;

use App\Models\Device;
use App\Models\User;

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
        return $user->hasPermission('devices.view')
            && ($user->isSuperAdmin() || $user->partner_id === $device->partner_id);
    }

    public function create(User $user)
    {
        return $user->hasPermission('devices.create');
    }

    public function update(User $user, Device $device)
    {
        return $user->hasPermission('devices.update')
            && ($user->isSuperAdmin() || $user->partner_id === $device->partner_id);
    }

    public function delete(User $user, Device $device)
    {
        return $user->hasPermission('devices.delete')
            && ($user->isSuperAdmin() || $user->partner_id === $device->partner_id);
    }
}
