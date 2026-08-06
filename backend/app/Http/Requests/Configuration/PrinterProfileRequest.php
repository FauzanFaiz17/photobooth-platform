<?php

namespace App\Http\Requests\Configuration;

use Illuminate\Foundation\Http\FormRequest;

class PrinterProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'printer_name' => ['required', 'string', 'max:150'],
            'copies' => ['required', 'integer', 'between:1,20'],
            'paper_size' => ['required', 'string', 'max:30'],
            'orientation' => ['required', 'in:portrait,landscape'],
            'auto_print' => ['required', 'boolean'],
            'border' => ['required', 'boolean'],
            'bleed' => ['required', 'numeric', 'between:0,100'],
            'delay_ms' => ['required', 'integer', 'between:0,60000'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
