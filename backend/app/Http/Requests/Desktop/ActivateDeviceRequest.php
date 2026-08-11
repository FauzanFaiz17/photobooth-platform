<?php

namespace App\Http\Requests\Desktop;

use Illuminate\Foundation\Http\FormRequest;

class ActivateDeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'activation_code' => ['required', 'string', 'max:32'],
            'device_uuid' => ['required', 'uuid'],
            'windows_uuid' => ['nullable', 'string', 'max:150'],
            'cpu_identifier' => ['nullable', 'string', 'max:150'],
            'mac_address' => ['nullable', 'string', 'max:50'],
            'app_version' => ['nullable', 'string', 'max:30'],
        ];
    }
}
