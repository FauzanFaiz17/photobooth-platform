<?php

namespace App\Http\Requests\Desktop;

use Illuminate\Foundation\Http\FormRequest;

class RecordPrintJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'device_uuid' => ['required', 'string'],
            'photo_session_id' => ['nullable', 'integer', 'exists:photo_sessions,id'],
            'paper_size' => ['required', 'string', 'in:2r,4r'],
            'copies' => ['nullable', 'integer', 'min:1', 'max:20'],
        ];
    }
}
