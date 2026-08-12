<?php
namespace App\Http\Requests\Printer;
use Illuminate\Foundation\Http\FormRequest;
class PrinterIndexRequest extends FormRequest { public function authorize(): bool { return true; } public function rules(): array { return ['partner_id'=>['nullable','integer','exists:partners,id'],'booth_id'=>['nullable','integer','exists:booths,id'],'device_id'=>['nullable','integer','exists:devices,id'],'is_active'=>['nullable','boolean'],'search'=>['nullable','string','max:100'],'per_page'=>['nullable','integer','between:5,100']]; } }
