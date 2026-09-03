<?php

namespace App\Http\Requests\Configuration;

use Illuminate\Foundation\Http\FormRequest;

class TemplateRequest extends FormRequest
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
            'paper_size' => ['sometimes', 'nullable', 'in:2r,4r'],
            'preview_path' => ['nullable', 'string', 'max:255'],
            'thumbnail_path' => ['nullable', 'string', 'max:255'],
            'json_layout' => ['required', 'array'],
            'psd_path' => ['nullable', 'string', 'max:255'],
            // The PNG is uploaded as multipart data and stored by TemplateService.
            'image' => ['nullable', 'file', 'mimes:png', 'max:10240'],
            'png_path' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:draft,published,archived'],
        ];
    }
}
