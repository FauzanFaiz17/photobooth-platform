<?php
namespace App\Http\Requests\Desktop;
use Illuminate\Foundation\Http\FormRequest;
class PollPrintJobsRequest extends FormRequest { public function authorize(): bool { return true; } public function rules(): array { return ['device_uuid'=>['required','uuid'],'limit'=>['nullable','integer','between:1,20']]; } protected function prepareForValidation(): void { $this->merge(['device_uuid'=>$this->header('X-Device-UUID')]); } }
