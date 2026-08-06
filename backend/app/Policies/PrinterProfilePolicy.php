<?php

namespace App\Policies;

use App\Models\PrinterProfile;
use App\Models\User;
use App\Policies\Concerns\AuthorizesTenantConfiguration;

class PrinterProfilePolicy
{
    use AuthorizesTenantConfiguration;

    public function viewAny(User $user): bool
    {
        return $this->canViewAny($user, 'printer_profiles.view');
    }

    public function view(User $user, PrinterProfile $printerProfile): bool
    {
        return $this->canView(
            $user,
            $printerProfile,
            'printer_profiles.view'
        );
    }

    public function create(User $user): bool
    {
        return $this->canCreate($user, 'printer_profiles.create');
    }

    public function update(User $user, PrinterProfile $printerProfile): bool
    {
        return $this->canMutate(
            $user,
            $printerProfile,
            'printer_profiles.update'
        );
    }

    public function delete(User $user, PrinterProfile $printerProfile): bool
    {
        return $this->canMutate(
            $user,
            $printerProfile,
            'printer_profiles.delete'
        );
    }
}
