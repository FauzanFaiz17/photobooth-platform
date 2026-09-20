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
            'type' => ['nullable', 'string', 'in:photo,gif'],
            'paper_size' => ['sometimes', 'nullable', 'in:2r,4r'],
            'preview_path' => ['nullable', 'string', 'max:255'],
            'thumbnail_path' => ['nullable', 'string', 'max:255'],
            'json_layout' => ['required', 'array'],
            'json_layout.canvas' => ['sometimes', 'array'],
            'json_layout.canvas.width' => ['sometimes', 'integer', 'min:1'],
            'json_layout.canvas.height' => ['sometimes', 'integer', 'min:1'],
            'json_layout.canvas.background' => ['sometimes', 'nullable', 'string', 'max:30'],
            'json_layout.paper_size' => ['sometimes', 'nullable', 'in:2r,4r'],
            'json_layout.slots_on_top' => ['sometimes', 'boolean'],
            'json_layout.layout' => ['sometimes', 'nullable', 'string', 'max:50'],
            'json_layout.frames' => ['sometimes', 'array'],
            'json_layout.frames.*.x' => ['sometimes', 'integer', 'min:0'],
            'json_layout.frames.*.y' => ['sometimes', 'integer', 'min:0'],
            'json_layout.frames.*.width' => ['sometimes', 'integer', 'min:1'],
            'json_layout.frames.*.height' => ['sometimes', 'integer', 'min:1'],
            'json_layout.frames.*.shot' => ['sometimes', 'integer', 'min:1'],
            'psd_path' => ['nullable', 'string', 'max:255'],
            // The PNG is uploaded as multipart data and stored by TemplateService.
            'image' => ['nullable', 'file', 'mimes:png', 'max:10240'],
            'png_path' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:draft,published,archived'],
        ];
    }
}
