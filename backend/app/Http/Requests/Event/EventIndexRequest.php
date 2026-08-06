<?php

namespace App\Http\Requests\Event;

use Illuminate\Foundation\Http\FormRequest;

class EventIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:150'],
            'status' => [
                'nullable',
                'in:draft,scheduled,ongoing,completed,cancelled',
            ],
            'booth_id' => ['nullable', 'integer', 'exists:booths,id'],
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'sort' => ['nullable', 'in:event_date,event_name,created_at,status'],
            'direction' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'between:5,100'],
        ];
    }
}
