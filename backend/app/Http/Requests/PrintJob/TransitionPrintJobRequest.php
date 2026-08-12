<?php
namespace App\Http\Requests\PrintJob;
use Illuminate\Foundation\Http\FormRequest;
class TransitionPrintJobRequest extends FormRequest { public function authorize(): bool { return true; } public function rules(): array { return ['status'=>['required','in:printing,success,failed,cancelled'],'duration_ms'=>['nullable','integer','min:0'],'error_log'=>['nullable','string','max:10000']]; } }
