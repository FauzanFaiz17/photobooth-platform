<?php

namespace App\Http\Requests\Event;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventRequest extends FormRequest
{
    /**
     * Determine if the user is authorized.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        return [

            'booth_id' => [
                'required',
                'integer',
                'exists:booths,id',
            ],

            'event_name' => [
                'required',
                'string',
                'max:150',
            ],

            'template_id' => [
                'required',
                'integer',
                'exists:templates,id',
            ],

            'filter_id' => [
                'required',
                'integer',
                'exists:filters,id',
            ],

            'camera_profile_id' => [
                'required',
                'integer',
                'exists:camera_profiles,id',
            ],

            'printer_profile_id' => [
                'required',
                'integer',
                'exists:printer_profiles,id',
            ],

            'event_date' => [
                'required',
                'date',
            ],

            'start_time' => [
                'required',
                'date_format:H:i',
            ],

            'end_time' => [
                'required',
                'date_format:H:i',
                'after:start_time',
            ],

            'price' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'print_count_limit' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'status' => [
                'nullable',
                'in:draft,scheduled',
            ],

        ];
    }

    /**
     * Custom messages.
     */
    public function messages(): array
    {
        return [

            'booth_id.required' => 'Booth wajib dipilih.',
            'booth_id.exists' => 'Booth tidak ditemukan.',

            'event_name.required' => 'Nama event wajib diisi.',

            'template_id.required' => 'Template wajib dipilih.',
            'template_id.exists' => 'Template tidak ditemukan.',

            'filter_id.required' => 'Filter wajib dipilih.',
            'filter_id.exists' => 'Filter tidak ditemukan.',

            'camera_profile_id.required' => 'Camera Profile wajib dipilih.',
            'camera_profile_id.exists' => 'Camera Profile tidak ditemukan.',

            'printer_profile_id.required' => 'Printer Profile wajib dipilih.',
            'printer_profile_id.exists' => 'Printer Profile tidak ditemukan.',

            'event_date.required' => 'Tanggal event wajib diisi.',

            'start_time.required' => 'Jam mulai wajib diisi.',

            'end_time.required' => 'Jam selesai wajib diisi.',
            'end_time.after' => 'Jam selesai harus lebih besar dari jam mulai.',

        ];
    }
}
