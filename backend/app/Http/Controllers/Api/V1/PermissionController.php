<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Support\ApiResponse;

class PermissionController extends Controller
{
    public function index()
    {
        $grouped = Permission::query()
            ->orderBy('module')
            ->orderBy('slug')
            ->get(['id', 'name', 'slug', 'module', 'description'])
            ->groupBy('module')
            ->map(fn ($permissions, $module) => [
                'module' => $module,
                'permissions' => $permissions->values(),
            ])
            ->values();

        return ApiResponse::success($grouped, 'Permissions loaded.');
    }
}
