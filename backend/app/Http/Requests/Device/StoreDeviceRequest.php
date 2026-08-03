<?php

namespace App\Http\Requests\Device;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreDeviceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
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
                'nullable',
                'exists:partners,id'
            ],

            'booth_id' => [
                'nullable',
                'exists:booths,id'
            ],

            'device_name' => [
                'required',
                'string',
                'max:150'
            ],

            'device_key' => [
                'required',
                'string',
                'unique:devices,device_key'
            ],

            'device_uuid' => [
                'required',
                'string',
                'unique:devices,device_uuid'
            ],

            'status' => [
                'nullable',
                'in:pending,active,blocked,revoked'
            ],
        ];
    }
}
