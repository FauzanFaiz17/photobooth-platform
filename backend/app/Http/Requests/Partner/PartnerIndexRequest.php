<?php

namespace App\Http\Requests\Partner;

use Illuminate\Foundation\Http\FormRequest;

class PartnerIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'search' => [
                'nullable',
                'string'
            ],

            'status' => [
                'nullable',
                'in:active,suspended,trial,inactive'
            ],

            'sort' => [
                'nullable',
                'in:id,company_name,created_at'
            ],

            'direction' => [
                'nullable',
                'in:asc,desc'
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:5',
                'max:100'
            ]

        ];
    }
}