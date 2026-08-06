<?php

namespace App\Http\Requests\Configuration;

use Illuminate\Foundation\Http\FormRequest;

class ConfigurationIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:150'],
            'scope' => ['nullable', 'in:global,partner'],
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'status' => ['nullable', 'in:draft,published,archived'],
            'is_active' => ['nullable', 'boolean'],
            'sort' => ['nullable', 'in:id,created_at,updated_at,version'],
            'direction' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'between:5,100'],
        ];
    }
}
