<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;

class RenewPartnerSubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'subscription_plan_id' => ['nullable', 'integer', 'exists:subscription_plans,id'],
            'periods' => ['nullable', 'integer', 'min:1', 'max:36'],
            'auto_renew' => ['nullable', 'boolean'],
        ];
    }
}
