<?php

namespace App\Policies;

use App\Models\Template;
use App\Models\User;
use App\Policies\Concerns\AuthorizesTenantConfiguration;

class TemplatePolicy
{
    use AuthorizesTenantConfiguration;

    public function viewAny(User $user): bool
    {
        return $this->canViewAny($user, 'templates.view');
    }

    public function view(User $user, Template $template): bool
    {
        return $this->canView($user, $template, 'templates.view');
    }

    public function create(User $user): bool
    {
        return $this->canCreate($user, 'templates.create');
    }

    public function update(User $user, Template $template): bool
    {
        return $this->canMutate($user, $template, 'templates.update');
    }

    public function delete(User $user, Template $template): bool
    {
        return $this->canMutate($user, $template, 'templates.delete');
    }
}
