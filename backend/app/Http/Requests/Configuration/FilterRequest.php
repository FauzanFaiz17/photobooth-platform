<?php

namespace App\Http\Requests\Configuration;

use Illuminate\Foundation\Http\FormRequest;

class FilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'name' => ['required', 'string', 'max:150'],
            'lut_path' => ['nullable', 'string', 'max:255'],
            'brightness' => ['required', 'numeric', 'between:-100,100'],
            'contrast' => ['required', 'numeric', 'between:-100,100'],
            'saturation' => ['required', 'numeric', 'between:-100,100'],
            'sharpness' => ['required', 'numeric', 'between:-100,100'],
            'white_balance' => ['required', 'numeric', 'between:-100,100'],
            'intensity' => ['required', 'numeric', 'between:0,100'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
