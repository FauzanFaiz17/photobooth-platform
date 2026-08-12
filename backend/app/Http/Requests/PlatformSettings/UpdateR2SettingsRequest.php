<?php

namespace App\Http\Requests\PlatformSettings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateR2SettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'access_key_id' => ['nullable', 'string', 'min:8', 'max:500'],
            'secret_access_key' => ['nullable', 'string', 'min:8', 'max:1000'],
            'bucket' => ['required', 'string', 'max:255'],
            'endpoint' => ['required', 'url:http,https', 'max:500'],
            'region' => ['sometimes', 'string', 'max:50'],
            'use_path_style_endpoint' => ['sometimes', 'boolean'],
            'enabled' => ['sometimes', 'boolean'],
        ];
    }
}
