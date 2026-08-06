<?php

namespace App\Http\Requests\Booth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBoothRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [

            'partner_id' => [
                Rule::requiredIf(
                    fn () => $this->user()?->isSuperAdmin() === true
                ),
                'nullable',
                'exists:partners,id',
            ],

            'name' => [
                'required',
                'string',
                'max:150',
            ],

            'location' => [
                'nullable',
                'string',
                'max:255',
            ],

            'status' => [
                'nullable',
                'in:active,maintenance,inactive',
            ],

        ];
    }
}
