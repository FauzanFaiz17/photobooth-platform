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

            'filter_ids' => ['nullable', 'array', 'min:1'],
            'filter_ids.*' => ['integer', 'exists:filters,id'],

            'gif_template_id' => ['nullable', 'integer', 'exists:templates,id'],

            'print_options' => ['nullable', 'array'],
            'print_options.*.paper_size' => ['required_with:print_options', 'in:2r,4r'],
            'print_options.*.unit_quantity' => ['required_with:print_options', 'integer', 'min:1'],
            'print_options.*.quantity_step' => ['nullable', 'integer', 'min:1'],
            'print_options.*.price' => ['required_with:print_options', 'numeric', 'min:0'],
            'print_options.*.discount' => ['nullable', 'numeric', 'min:0'],

            'status' => [
                'required',
                'in:draft,scheduled,ongoing,completed,cancelled',
            ],
        ];
    }
}
