<?php

namespace App\Http\Requests\Device;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'partner_id' => [
                Rule::requiredIf(fn () => $this->user()?->isSuperAdmin() === true),
                'nullable',
                'integer',
                'exists:partners,id',
            ],
            'booth_id' => ['required', 'integer', 'exists:booths,id'],
            'device_name' => ['required', 'string', 'max:150'],
        ];
    }
}
