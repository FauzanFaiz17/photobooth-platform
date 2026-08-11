<?php

namespace App\Http\Requests\Voucher;

use Illuminate\Foundation\Http\FormRequest;

class IssueVoucherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'voucher_package_id' => ['required', 'integer', 'exists:voucher_packages,id'],
            'code' => ['nullable', 'string', 'max:50', 'regex:/^[A-Za-z0-9-]+$/'],
            'idempotency_key' => ['required', 'string', 'max:100'],
            'expired_at' => ['nullable', 'date', 'after:now'],
        ];
    }
}
