<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VoucherPackage;

class VoucherPackagePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('vouchers.view');
    }

    public function view(User $user, VoucherPackage $package): bool
    {
        return $user->hasPermission('vouchers.view')
            && ($user->isSuperAdmin() || $package->partner_id === null || $package->partner_id === $user->partner_id);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('vouchers.create');
    }

    public function update(User $user, VoucherPackage $package): bool
    {
        return $user->hasPermission('vouchers.update')
            && ($user->isSuperAdmin()
                || ($package->partner_id !== null && $package->partner_id === $user->partner_id));
    }

    public function delete(User $user, VoucherPackage $package): bool
    {
        return $user->hasPermission('vouchers.delete')
            && ($user->isSuperAdmin()
                || ($package->partner_id !== null && $package->partner_id === $user->partner_id));
    }
}
