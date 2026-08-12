<?php

namespace App\Policies;

use App\Models\Printer;
use App\Models\User;

class PrinterPolicy
{
    public function viewAny(User $user): bool { return $user->hasPermission('printers.view'); }
    public function view(User $user, Printer $printer): bool { return $user->hasPermission('printers.view') && ($user->isSuperAdmin() || $user->partner_id === $printer->partner_id); }
    public function create(User $user): bool { return $user->hasPermission('printers.create'); }
    public function update(User $user, Printer $printer): bool { return $user->hasPermission('printers.update') && ($user->isSuperAdmin() || $user->partner_id === $printer->partner_id); }
    public function delete(User $user, Printer $printer): bool { return $user->hasPermission('printers.delete') && ($user->isSuperAdmin() || $user->partner_id === $printer->partner_id); }
}
