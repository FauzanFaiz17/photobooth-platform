<?php

namespace App\Http\Requests\Partner;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePartnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'company_name' => [
                'required',
                'string',
                'max:150'
            ],

            'brand_name' => [
                'nullable',
                'string',
                'max:150'
            ],

            'address' => [
                'nullable',
                'string'
            ],

            'phone' => [
                'nullable',
                'string',
                'max:30'
            ],

            'email' => [

                'required',

                'email',

                Rule::unique('partners')
                    ->ignore($this->partner)

            ],

            'tax_number' => [
                'nullable',
                'string',
                'max:50'
            ],

            'status' => [
                'required',
                'in:active,suspended,trial,inactive'
            ]

        ];
    }
}