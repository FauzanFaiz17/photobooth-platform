<?php

namespace App\Policies;

use App\Models\PrintJob;
use App\Models\User;

class PrintJobPolicy
{
    public function viewAny(User $user): bool { return $user->hasPermission('print_jobs.view'); }
    public function view(User $user, PrintJob $job): bool { return $user->hasPermission('print_jobs.view') && ($user->isSuperAdmin() || $user->partner_id === $job->partner_id); }
    public function create(User $user): bool { return $user->hasPermission('print_jobs.create'); }
    public function update(User $user, PrintJob $job): bool { return $user->hasPermission('print_jobs.update') && ($user->isSuperAdmin() || $user->partner_id === $job->partner_id); }
}
