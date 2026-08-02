<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\User;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', User::class);
    }

    public function rules(): array
    {
        return [

            'name' => [
                'required',
                'string',
                'max:150'
            ],

            'email' => [
                'required',
                'email',
                Rule::unique('users')
                    ->ignore($this->route('user'))
            ],

            'phone' => [
                'nullable',
                'string',
                'max:30'
            ],

            'status' => [
                'required',
                Rule::in([
                    'active',
                    'inactive',
                    'suspended'
                ])
            ]
        ];
    }
}