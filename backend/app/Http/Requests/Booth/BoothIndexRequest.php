<?php

namespace App\Http\Requests\Booth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BoothIndexRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [

            'search' => ['nullable', 'string'],

            'status' => [
                'nullable',
                'in:active,maintenance,inactive',
            ],

            'partner' => [
                'nullable',
                'exists:partners,id',
            ],

            'sort' => [
                'nullable',
                'in:id,name,created_at',
            ],

            'direction' => [
                'nullable',
                'in:asc,desc',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'between:5,100',
            ],

        ];
    }
}
