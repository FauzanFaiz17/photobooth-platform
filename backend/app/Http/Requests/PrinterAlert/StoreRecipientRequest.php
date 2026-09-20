<?php

namespace App\Http\Requests\PrinterAlert;

use Illuminate\Foundation\Http\FormRequest;

class StoreRecipientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
