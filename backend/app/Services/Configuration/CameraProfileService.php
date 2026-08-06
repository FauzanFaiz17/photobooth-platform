<?php

namespace App\Services\Configuration;

use App\Models\CameraProfile;
use Illuminate\Database\Eloquent\Builder;

class CameraProfileService extends TenantConfigurationService
{
    protected string $modelClass = CameraProfile::class;

    protected function applyDomainFilters(Builder $query, array $filters): void
    {
        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }
    }
}
