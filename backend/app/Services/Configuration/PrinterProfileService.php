<?php

namespace App\Services\Configuration;

use App\Models\PrinterProfile;
use Illuminate\Database\Eloquent\Builder;

class PrinterProfileService extends TenantConfigurationService
{
    protected string $modelClass = PrinterProfile::class;

    protected string $searchColumn = 'printer_name';

    protected function applyDomainFilters(Builder $query, array $filters): void
    {
        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }
    }
}
