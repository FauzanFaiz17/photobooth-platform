<?php
namespace App\Http\Requests\Printer;
class UpdatePrinterRequest extends StorePrinterRequest { public function rules(): array { $rules=parent::rules(); $rules['partner_id']=['prohibited']; return $rules; } }
