<?php

namespace App\Policies;

use App\Models\CameraProfile;
use App\Models\User;
use App\Policies\Concerns\AuthorizesTenantConfiguration;

class CameraProfilePolicy
{
    use AuthorizesTenantConfiguration;

    public function viewAny(User $user): bool
    {
        return $this->canViewAny($user, 'camera_profiles.view');
    }

    public function view(User $user, CameraProfile $cameraProfile): bool
    {
        return $this->canView(
            $user,
            $cameraProfile,
            'camera_profiles.view'
        );
    }

    public function create(User $user): bool
    {
        return $this->canCreate($user, 'camera_profiles.create');
    }

    public function update(User $user, CameraProfile $cameraProfile): bool
    {
        return $this->canMutate(
            $user,
            $cameraProfile,
            'camera_profiles.update'
        );
    }

    public function delete(User $user, CameraProfile $cameraProfile): bool
    {
        return $this->canMutate(
            $user,
            $cameraProfile,
            'camera_profiles.delete'
        );
    }
}
