<?php

namespace App\Http\Requests\Voucher;

use Illuminate\Foundation\Http\FormRequest;

class VoucherIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'voucher_package_id' => ['nullable', 'integer', 'exists:voucher_packages,id'],
            'status' => ['nullable', 'in:unused,redeemed,expired,void'],
            'search' => ['nullable', 'string', 'max:50'],
            'sort' => ['nullable', 'in:id,code,status,expired_at,created_at'],
            'direction' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'between:5,100'],
        ];
    }
}
