<?php

namespace App\Http\Requests\Partner;

use Illuminate\Foundation\Http\FormRequest;

class StorePartnerRequest extends FormRequest
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
                'unique:partners,email'
            ],

            'tax_number' => [
                'nullable',
                'string',
                'max:50'
            ],

            'status' => [
                'nullable',
                'in:active,suspended,trial,inactive'
            ]

        ];
    }
}