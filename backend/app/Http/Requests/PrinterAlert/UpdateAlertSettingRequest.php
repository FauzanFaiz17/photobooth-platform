<?php

namespace App\Http\Requests\PrinterAlert;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAlertSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'total_print_limit' => ['sometimes', 'integer', 'min:1'],
            'low_stock_threshold' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
