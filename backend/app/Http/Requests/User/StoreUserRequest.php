<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
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
                'unique:users,email'
            ],

            'phone' => [
                'nullable',
                'string',
                'max:30'
            ],

            'password' => [
                'required',
                'confirmed',
                'min:8'
            ],

            'role_id' => [
                'required',
                'exists:roles,id'
            ],

            'partner_id' => [
                'nullable',
                'exists:partners,id'
            ],

            'status' => [
                'nullable',
                'in:active,suspended,invited,inactive'
            ]

        ];
    }
}