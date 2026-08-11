<?php

namespace App\Http\Requests\Device;

use Illuminate\Foundation\Http\FormRequest;

class DeviceIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:150'],
            'status' => ['nullable', 'in:pending,active,blocked,revoked'],
            'booth_id' => ['nullable', 'integer', 'exists:booths,id'],
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'sort' => ['nullable', 'in:id,device_name,status,created_at,activated_at'],
            'direction' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'between:5,100'],
        ];
    }
}
