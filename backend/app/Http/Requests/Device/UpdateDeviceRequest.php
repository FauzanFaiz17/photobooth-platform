<?php

namespace App\Http\Requests\Device;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'booth_id' => ['required', 'integer', 'exists:booths,id'],
            'device_name' => ['required', 'string', 'max:150'],
            'status' => ['required', 'in:pending,active,blocked,revoked'],
        ];
    }
}
