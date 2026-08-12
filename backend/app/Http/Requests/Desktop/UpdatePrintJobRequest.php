<?php
namespace App\Http\Requests\Desktop;
class UpdatePrintJobRequest extends PollPrintJobsRequest { public function rules(): array { return ['device_uuid'=>['required','uuid'],'status'=>['required','in:printing,success,failed'],'duration_ms'=>['nullable','integer','min:0'],'error_log'=>['nullable','string','max:10000']]; } }
