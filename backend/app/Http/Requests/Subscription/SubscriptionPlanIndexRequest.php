<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;

class SubscriptionPlanIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'search' => ['nullable','string'],

            'is_active' => ['nullable','boolean'],

            'sort' => [
                'nullable',
                'in:id,name,price,created_at'
            ],

            'direction' => [
                'nullable',
                'in:asc,desc'
            ],

            'per_page' => [
                'nullable',
                'integer',
                'between:5,100'
            ]

        ];
    }
}