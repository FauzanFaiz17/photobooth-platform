<?php
namespace App\Http\Requests\PrintJob;
use Illuminate\Foundation\Http\FormRequest;
class StorePrintJobRequest extends FormRequest { public function authorize(): bool { return true; } public function rules(): array { return ['photo_session_id'=>['required','integer','exists:photo_sessions,id'],'printer_id'=>['required','integer','exists:printers,id'],'copies'=>['sometimes','integer','between:1,20'],'idempotency_key'=>['nullable','string','max:100']]; } }
