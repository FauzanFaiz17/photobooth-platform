<?php

namespace App\Http\Requests\Desktop;

use Illuminate\Foundation\Http\FormRequest;

class StorePhotoSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'device_uuid' => ['required', 'uuid'],
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'payment_id' => ['nullable', 'integer', 'exists:payments,id'],
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
