<?php

namespace App\Http\Requests\Event;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'event_name' => ['required', 'string', 'max:150'],

            'event_date' => ['required', 'date'],

            'start_time' => ['required', 'date_format:H:i'],

            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],

            'price' => ['nullable', 'numeric', 'min:0'],

            'print_count_limit' => ['nullable', 'integer', 'min:0'],
        ];
    }
}