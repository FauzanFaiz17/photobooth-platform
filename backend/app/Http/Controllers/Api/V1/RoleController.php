<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Role\SyncRolePermissionsRequest;
use App\Models\Role;
use App\Services\AuditService;
use App\Support\ApiResponse;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    public function __construct(protected AuditService $auditService) {}

    public function index()
    {
        $roles = Role::query()
            ->with('permissions:id,slug,module,name')
            ->withCount('users')
            ->orderByDesc('level')
            ->get()
            ->map(fn (Role $role) => $this->presentRole($role));

        return ApiResponse::success($roles, 'Roles loaded.');
    }

    public function show(Role $role)
    {
        $role->load(['permissions:id,slug,module,name']);
        $role->loadCount('users');

        return ApiResponse::success($this->presentRole($role), 'Role loaded.');
    }

    public function syncPermissions(SyncRolePermissionsRequest $request, Role $role)
    {
        if ($role->slug === 'super-admin') {
            return ApiResponse::error(
                'Super Admin role permissions cannot be modified.',
                null,
                422
            );
        }

        $permissionIds = $request->validated('permission_ids');

        $before = $role->permissions()
            ->pluck('slug')
            ->sort()
            ->values();

        DB::transaction(function () use ($role, $permissionIds) {
            $role->permissions()->sync($permissionIds);
        });

        $after = $role->permissions()
            ->pluck('slug')
            ->sort()
            ->values();

        $this->auditService->record(
            'update',
            $request->user(),
            $role,
            'Role permissions updated.',
            [
                'role' => $role->slug,
                'added' => $after->diff($before)->values()->all(),
                'removed' => $before->diff($after)->values()->all(),
            ]
        );

        $role->load(['permissions:id,slug,module,name']);
        $role->loadCount('users');

        return ApiResponse::success(
            $this->presentRole($role),
            'Role permissions updated.'
        );
    }

    private function presentRole(Role $role): array
    {
        return [
            'id' => $role->id,
            'name' => $role->name,
            'slug' => $role->slug,
            'level' => $role->level,
            'description' => $role->description,
            'is_system' => $role->is_system,
            'users_count' => $role->users_count ?? 0,
            'permission_ids' => $role->permissions->pluck('id')->values(),
            'permission_slugs' => $role->permissions->pluck('slug')->values(),
        ];
    }
}
