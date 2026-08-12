<?php
namespace App\Http\Requests\PrintJob;
use Illuminate\Foundation\Http\FormRequest;
class PrintJobIndexRequest extends FormRequest { public function authorize(): bool { return true; } public function rules(): array { return ['partner_id'=>['nullable','integer','exists:partners,id'],'printer_id'=>['nullable','integer','exists:printers,id'],'photo_session_id'=>['nullable','integer','exists:photo_sessions,id'],'status'=>['nullable','in:queued,printing,success,failed,cancelled'],'per_page'=>['nullable','integer','between:5,100']]; } }
