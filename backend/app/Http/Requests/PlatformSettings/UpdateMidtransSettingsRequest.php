<?php

namespace App\Http\Requests\PlatformSettings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMidtransSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'merchant_id' => ['required', 'string', 'max:100'],
            'client_key' => ['nullable', 'string', 'min:8', 'max:500'],
            'server_key' => ['nullable', 'string', 'min:8', 'max:500'],
            'production' => ['required', 'boolean'],
            'qris_enabled' => ['sometimes', 'boolean'],
            'timeout' => ['sometimes', 'integer', 'between:3,60'],
        ];
    }
}
