<?php

namespace App\Http\Requests\Desktop;

use Illuminate\Foundation\Http\FormRequest;

class StoreMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'device_uuid' => ['required', 'uuid'],
            'type' => [
                'required',
                'string',
                'in:original,edited,template,gif,video,thumbnail,ai_generated',
            ],
            'filename' => [
                'required',
                'string',
                'max:255',
                'regex:/^[^\\\\\/]+$/',
            ],
            'mime_type' => [
                'required',
                'string',
                'in:image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/zip',
            ],
            'data_url' => ['required', 'string', 'max:120000000'],
            'width' => ['nullable', 'integer', 'min:1'],
            'height' => ['nullable', 'integer', 'min:1'],
            'duration_seconds' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'device_uuid' => $this->header('X-Device-UUID'),
        ]);
    }

    public function deviceUuid(): string
    {
        return $this->validated('device_uuid');
    }
}
