<?php

namespace App\Http\Requests\Configuration;

use Illuminate\Foundation\Http\FormRequest;

class CameraProfileRequest extends FormRequest
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
            'iso' => ['nullable', 'string', 'max:20'],
            'shutter_speed' => ['nullable', 'string', 'max:20'],
            'aperture' => ['nullable', 'string', 'max:20'],
            'white_balance' => ['nullable', 'string', 'max:20'],
            'exposure' => ['nullable', 'string', 'max:20'],
            'focus_mode' => ['nullable', 'string', 'max:30'],
            'countdown_seconds' => ['required', 'integer', 'in:2,3,5'],
            'burst_count' => ['required', 'integer', 'between:1,20'],
            'image_quality' => ['nullable', 'string', 'max:20'],
            'live_view' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
