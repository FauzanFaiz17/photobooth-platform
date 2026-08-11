<?php

namespace App\Http\Requests\Voucher;

use Illuminate\Foundation\Http\FormRequest;

class VoucherPackageIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:150'],
            'scope' => ['nullable', 'in:global,partner'],
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'is_active' => ['nullable', 'boolean'],
            'sort' => ['nullable', 'in:id,name,price,created_at'],
            'direction' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'between:5,100'],
        ];
    }
}
