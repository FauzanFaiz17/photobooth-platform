<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Access\AuthorizationException;

class UserService
{
    /**
     * Get list of users
     */
    public function index(array $filters, User $authUser)
    {
        $query = User::query()
            ->with(['role', 'partner']);

        if (!$authUser->isSuperAdmin()) {
            $query->where('partner_id', $authUser->partner_id);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                    ->orWhere('email', 'like', "%{$filters['search']}%");
            });
        }

        if (!empty($filters['role'])) {
            $query->where('role_id', $filters['role']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (
            $authUser->isSuperAdmin() &&
            !empty($filters['partner'])
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
            'partner'
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
            if (!$authUser->canManageRole($role)) {
                throw new AuthorizationException(
                    'You are not allowed to assign this role.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Multi Tenant
            |--------------------------------------------------------------------------
            */
            if (!$authUser->isSuperAdmin()) {

                // Partner Owner / Manager tidak boleh memilih partner lain
                $data['partner_id'] = $authUser->partner_id;

            } elseif (
                empty($data['partner_id'])
                && $role->slug !== 'super-admin'
            ) {

                throw new \InvalidArgumentException(
                    'Partner is required.'
                );

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
                'partner'
            ]);
        });
    }
    
    public function update(
        User $target,
        array $data,
        User $auth
    ): User
    {
        return DB::transaction(function () use ($target, $data, $auth) {

            /*
             * Jika role diubah, pastikan user yang sedang login
             * memiliki hak untuk mengubah role tersebut.
             */
            if (!empty($data['role_id'])) {
                $newRole = Role::findOrFail($data['role_id']);

                if (!$auth->canManageRole($newRole)) {
                    abort(403, 'You cannot assign this role.');
                }
            }

            /*
             * Jika partner diubah, pastikan user yang sedang login
             * memiliki hak untuk mengubah partner tersebut.
             */
            if (!empty($data['partner_id'])) {
                if (!$auth->isSuperAdmin()) {
                    abort(403, 'You cannot change the partner.');
                }
            }

            $target->update($data);

            return $target->load([
                'role',
                'partner'
            ]);
        });
    }
}