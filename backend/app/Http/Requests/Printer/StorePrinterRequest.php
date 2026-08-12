<?php
namespace App\Http\Requests\Printer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
class StorePrinterRequest extends FormRequest { public function authorize(): bool { return true; } public function rules(): array { return ['partner_id'=>[Rule::requiredIf(fn()=> $this->user()?->isSuperAdmin() === true),'nullable','integer','exists:partners,id'],'booth_id'=>['nullable','integer','exists:booths,id'],'device_id'=>['nullable','integer','exists:devices,id'],'name'=>['required','string','max:150'],'driver_name'=>['nullable','string','max:150'],'is_active'=>['sometimes','boolean']]; } }
