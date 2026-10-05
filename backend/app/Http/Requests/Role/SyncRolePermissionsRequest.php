<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;

class SyncRolePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null
            && $user->isSuperAdmin()
            && $user->hasPermission('roles.update');
    }

    public function rules(): array
    {
        return [

            'permission_ids' => [
                'present',
                'array',
            ],

            'permission_ids.*' => [
                'integer',
                'distinct',
                'exists:permissions,id',
            ],

        ];
    }
}
