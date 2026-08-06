<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UserService
{
    /**
     * Get list of users
     */
    public function index(array $filters, User $authUser)
    {
        $query = User::query()
            ->with(['role', 'partner']);

        if (! $authUser->isSuperAdmin()) {
            $query->where('partner_id', $authUser->partner_id);
        }

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                    ->orWhere('email', 'like', "%{$filters['search']}%");
            });
        }

        if (! empty($filters['role'])) {
            $query->where('role_id', $filters['role']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (
            $authUser->isSuperAdmin() &&
            ! empty($filters['partner'])
        ) {
            $query->where('partner_id', $filters['partner']);
        }
        $sort = $filters['sort'] ?? 'created_at';
        $direction = $filters['direction'] ?? 'desc';

        return $query
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 10);
    }

    /**
     * Show detail user
     */
    public function show(User $user): User
    {
        return $user->load([
            'role',
            'partner',
        ]);
    }

    /**
     * Store new user
     */
    public function store(array $data, User $authUser): User
    {
        return DB::transaction(function () use ($data, $authUser) {

            /*
            |--------------------------------------------------------------------------
            | Get Target Role
            |--------------------------------------------------------------------------
            */
            $role = Role::findOrFail($data['role_id']);

            /*
            |--------------------------------------------------------------------------
            | Check Role Hierarchy
            |--------------------------------------------------------------------------
            */
            if (! $authUser->canManageRole($role)) {
                throw new AuthorizationException(
                    'You are not allowed to assign this role.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Multi Tenant
            |--------------------------------------------------------------------------
            */
            if (! $authUser->isSuperAdmin()) {

                // Partner Owner / Manager tidak boleh memilih partner lain
                $data['partner_id'] = $authUser->partner_id;

            } elseif (
                empty($data['partner_id'])
                && $role->slug !== 'super-admin'
            ) {

                throw ValidationException::withMessages([
                    'partner_id' => 'Partner is required.',
                ]);

            }

            /*
            |--------------------------------------------------------------------------
            | Default Status
            |--------------------------------------------------------------------------
            */
            $data['status'] = $data['status'] ?? 'active';

            /*
            |--------------------------------------------------------------------------
            | Create User
            |--------------------------------------------------------------------------
            */
            $user = User::create($data);

            return $user->load([
                'role',
                'partner',
            ]);
        });
    }

    public function update(
        User $target,
        array $data,
        User $auth
    ): User {
        return DB::transaction(function () use ($target, $data, $auth) {
            if (isset($data['role_id'])) {
                $role = Role::findOrFail($data['role_id']);

                if (! $auth->canManageRole($role)) {
                    throw new AuthorizationException(
                        'You are not allowed to assign this role.'
                    );
                }
            }

            if (! $auth->isSuperAdmin()) {
                $data['partner_id'] = $auth->partner_id;
            } elseif (array_key_exists('partner_id', $data)) {
                $roleId = $data['role_id'] ?? $target->role_id;
                $role = Role::findOrFail($roleId);

                if ($role->slug !== 'super-admin' && empty($data['partner_id'])) {
                    throw ValidationException::withMessages([
                        'partner_id' => 'Partner is required.',
                    ]);
                }
            }

            if (empty($data['password'])) {
                unset($data['password']);
            }

            $target->update($data);

            return $target->load([
                'role',
                'partner',
            ]);
        });
    }

    public function destroy(User $target, User $auth): void
    {
        if ($target->is($auth)) {
            throw ValidationException::withMessages([
                'user' => 'You cannot delete your own account.',
            ]);
        }

        $target->delete();
    }
}
