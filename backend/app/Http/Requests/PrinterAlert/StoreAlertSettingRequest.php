<?php

namespace App\Http\Requests\PrinterAlert;

use Illuminate\Foundation\Http\FormRequest;

class StoreAlertSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'total_print_limit' => ['required', 'integer', 'min:1'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
