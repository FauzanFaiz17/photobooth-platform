<?php

namespace App\Services\Configuration;

use App\Models\Partner;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

abstract class TenantConfigurationService
{
    /** @var class-string<Model> */
    protected string $modelClass;

    protected string $searchColumn = 'name';

    public function index(array $filters, User $user): LengthAwarePaginator
    {
        $query = $this->newQuery()->with('partner');

        $this->applyVisibilityScope($query, $user);

        if (! empty($filters['search'])) {
            $query->where(
                $this->searchColumn,
                'like',
                "%{$filters['search']}%"
            );
        }

        if (! empty($filters['scope'])) {
            $filters['scope'] === 'global'
                ? $query->whereNull('partner_id')
                : $query->whereNotNull('partner_id');
        }

        if ($user->isSuperAdmin() && ! empty($filters['partner_id'])) {
            $query->where('partner_id', $filters['partner_id']);
        }

        $this->applyDomainFilters($query, $filters);

        return $query
            ->orderBy(
                $filters['sort'] ?? 'created_at',
                $filters['direction'] ?? 'desc'
            )
            ->paginate($filters['per_page'] ?? 10);
    }

    public function show(Model $configuration): Model
    {
        return $configuration->load('partner');
    }

    public function store(array $data, User $user): Model
    {
        return DB::transaction(function () use ($data, $user) {
            $data['partner_id'] = $this->resolvePartnerId($data, $user);
            $data['version'] = 1;

            return $this->newQuery()
                ->create($data)
                ->load('partner');
        });
    }

    public function update(Model $configuration, array $data, User $user): Model
    {
        return DB::transaction(function () use ($configuration, $data, $user) {
            if ($user->isSuperAdmin() && array_key_exists('partner_id', $data)) {
                $data['partner_id'] = $this->resolvePartnerId($data, $user);
            } elseif (! $user->isSuperAdmin()) {
                unset($data['partner_id']);
            }

            $data['version'] = $configuration->version + 1;
            $configuration->update($data);

            return $configuration->fresh()->load('partner');
        });
    }

    public function destroy(Model $configuration): void
    {
        $configuration->delete();
    }

    protected function newQuery(): Builder
    {
        return ($this->modelClass)::query();
    }

    protected function applyVisibilityScope(Builder $query, User $user): void
    {
        if ($user->isSuperAdmin()) {
            return;
        }

        $query->where(function (Builder $query) use ($user) {
            $query->whereNull('partner_id')
                ->orWhere('partner_id', $user->partner_id);
        });
    }

    protected function resolvePartnerId(array $data, User $user): ?int
    {
        if (! $user->isSuperAdmin()) {
            if (! $user->partner_id) {
                throw ValidationException::withMessages([
                    'partner_id' => 'The authenticated user must belong to a partner.',
                ]);
            }

            return $user->partner_id;
        }

        $partnerId = $data['partner_id'] ?? null;

        if ($partnerId !== null) {
            Partner::findOrFail($partnerId);
        }

        return $partnerId;
    }

    protected function applyDomainFilters(Builder $query, array $filters): void
    {
        // Implemented by services that expose status filters.
    }
}
