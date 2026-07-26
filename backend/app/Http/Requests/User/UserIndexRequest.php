<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UserIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'search'=>['nullable','string'],

            'role'=>['nullable','integer','exists:roles,id'],

            'partner'=>['nullable','integer','exists:partners,id'],

            'status'=>['nullable','string'],

            'sort'=>['nullable','in:id,name,email,created_at,last_login_at'],

            'direction'=>['nullable','in:asc,desc'],

            'per_page'=>['nullable','integer','min:5','max:100']

        ];
    }
}