<?php

namespace App\Http\Requests\Desktop;

use Illuminate\Foundation\Http\FormRequest;

class BootstrapRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'device_uuid' => ['required', 'uuid'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'device_uuid' => $this->header('X-Device-UUID'),
        ]);
    }

    public function deviceUuid(): ?string
    {
        return $this->validated('device_uuid');
    }
}
