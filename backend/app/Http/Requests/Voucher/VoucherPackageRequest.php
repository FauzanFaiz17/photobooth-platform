<?php

namespace App\Http\Requests\Voucher;

use Illuminate\Foundation\Http\FormRequest;

class VoucherPackageRequest extends FormRequest
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
            'price' => ['required', 'numeric', 'min:0'],
            'persons' => ['required', 'integer', 'min:1', 'max:100'],
            'captures' => ['required', 'integer', 'min:1', 'max:100'],
            'print_count' => ['required', 'integer', 'min:0', 'max:100'],
            'gif_included' => ['required', 'boolean'],
            'video_included' => ['required', 'boolean'],
            'template_id' => ['nullable', 'integer', 'exists:templates,id'],
            'validity_days' => ['required', 'integer', 'min:1', 'max:3650'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
