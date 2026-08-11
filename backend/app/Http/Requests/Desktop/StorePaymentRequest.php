<?php

namespace App\Http\Requests\Desktop;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
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
            'amount' => ['nullable', 'numeric', 'min:0'],
            'gateway' => ['required', 'in:midtrans_qris,cash,other'],
            'idempotency_key' => ['required', 'string', 'max:100'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['device_uuid' => $this->header('X-Device-UUID')]);
    }
}
