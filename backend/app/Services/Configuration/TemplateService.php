<?php

namespace App\Services\Configuration;

use App\Models\Template;
use Illuminate\Database\Eloquent\Builder;

class TemplateService extends TenantConfigurationService
{
    protected string $modelClass = Template::class;

    protected function applyDomainFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
    }
}
