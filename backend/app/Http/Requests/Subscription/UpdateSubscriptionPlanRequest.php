<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubscriptionPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'name' => [

                'required',

                'string',

                'max:100',

                Rule::unique('subscription_plans')
                    ->ignore($this->route('subscriptionPlan')),

            ],

            'price' => [
                'required',
                'numeric',
                'min:0',
            ],

            'billing_cycle' => [
                'required',
                'in:monthly,yearly',
            ],

            'max_booths' => [
                'required',
                'integer',
                'min:1',
            ],

            'max_devices' => [
                'required',
                'integer',
                'min:1',
            ],

            'max_operators' => [
                'required',
                'integer',
                'min:1',
            ],

            'features' => [
                'nullable',
                'array',
            ],

            'features.*' => [
                'string',
            ],

            'is_active' => [
                'required',
                'boolean',
            ],

        ];
    }
}
