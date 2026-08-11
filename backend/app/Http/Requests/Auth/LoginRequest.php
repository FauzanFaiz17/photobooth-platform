<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'email' => [
                'required',
                'email',
            ],

            'password' => [
                'required',
                'string',
            ],

            'device_uuid' => [
                'nullable',
                'uuid',
            ],

        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->hasHeader('X-Device-UUID')) {
            $this->merge([
                'device_uuid' => $this->header('X-Device-UUID'),
            ]);
        }
    }
}
