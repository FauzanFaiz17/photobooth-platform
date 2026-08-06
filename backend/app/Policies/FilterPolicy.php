<?php

namespace App\Policies;

use App\Models\Filter;
use App\Models\User;
use App\Policies\Concerns\AuthorizesTenantConfiguration;

class FilterPolicy
{
    use AuthorizesTenantConfiguration;

    public function viewAny(User $user): bool
    {
        return $this->canViewAny($user, 'filters.view');
    }

    public function view(User $user, Filter $filter): bool
    {
        return $this->canView($user, $filter, 'filters.view');
    }

    public function create(User $user): bool
    {
        return $this->canCreate($user, 'filters.create');
    }

    public function update(User $user, Filter $filter): bool
    {
        return $this->canMutate($user, $filter, 'filters.update');
    }

    public function delete(User $user, Filter $filter): bool
    {
        return $this->canMutate($user, $filter, 'filters.delete');
    }
}
