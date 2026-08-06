<?php

namespace App\Services\Configuration;

use App\Models\Filter;
use Illuminate\Database\Eloquent\Builder;

class FilterService extends TenantConfigurationService
{
    protected string $modelClass = Filter::class;

    protected function applyDomainFilters(Builder $query, array $filters): void
    {
        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }
    }
}
