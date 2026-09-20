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

            'print_count_limit' => ['nullable', 'integer', 'min:0'],

            'payment_mode' => ['nullable', 'string', 'in:disabled,voucher_only,full'],

            'video_enabled' => ['nullable', 'boolean'],

            'gif_enabled' => ['nullable', 'boolean'],

            'template_ids' => ['nullable', 'array', 'min:1'],
            'template_ids.*' => ['integer', 'exists:templates,id'],

            'status' => [
                'required',
                'in:draft,scheduled,ongoing,completed,cancelled',
            ],
        ];
    }
}
