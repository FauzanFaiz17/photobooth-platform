<?php

namespace App\Http\Requests\Booth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreBoothRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [

            'partner_id'=>[
                'nullable',
                'exists:partners,id'
            ],

            'name'=>[
                'required',
                'string',
                'max:150'
            ],

            'location'=>[
                'nullable',
                'string',
                'max:255'
            ],

            'status'=>[
                'nullable',
                'in:active,maintenance,inactive'
            ]

        ];
    }
}
