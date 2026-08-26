<?php

namespace App\Http\Requests\Desktop;

use Illuminate\Foundation\Http\FormRequest;

class ResolveCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'device_uuid' => ['required', 'uuid'],
            'name' => ['nullable', 'string', 'max:150', 'required_without_all:phone,email'],
            'phone' => ['nullable', 'string', 'max:30', 'required_without_all:name,email'],
            'email' => ['nullable', 'email', 'max:150', 'required_without_all:name,phone'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['device_uuid' => $this->header('X-Device-UUID')]);
    }
}
