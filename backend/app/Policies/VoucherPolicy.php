<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Voucher;

class VoucherPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('vouchers.view');
    }

    public function view(User $user, Voucher $voucher): bool
    {
        return $user->hasPermission('vouchers.view')
            && ($user->isSuperAdmin() || $user->partner_id === $voucher->partner_id);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('vouchers.create');
    }

    public function update(User $user, Voucher $voucher): bool
    {
        return $user->hasPermission('vouchers.update')
            && ($user->isSuperAdmin() || $user->partner_id === $voucher->partner_id);
    }
}
