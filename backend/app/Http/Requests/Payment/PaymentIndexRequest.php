<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

class PaymentIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'gateway' => ['nullable', 'in:midtrans_qris,voucher,cash,other'],
            'status' => ['nullable', 'in:pending,paid,failed,expired,refunded'],
            'search' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', 'in:id,amount,status,paid_at,created_at'],
            'direction' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'between:5,100'],
        ];
    }
}
