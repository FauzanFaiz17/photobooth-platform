<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('payments.view');
    }

    public function view(User $user, Payment $payment): bool
    {
        return $user->hasPermission('payments.view')
            && ($user->isSuperAdmin() || $user->partner_id === $payment->partner_id);
    }

    public function update(User $user, Payment $payment): bool
    {
        return $user->isSuperAdmin() && $user->hasPermission('payments.update');
    }
}
