<?php
namespace App\Http\Requests\Desktop;
use Illuminate\Foundation\Http\FormRequest;
class StorePhotoSessionRequest extends FormRequest { public function authorize(): bool { return true; } public function rules(): array { return ['event_id'=>['nullable','integer','exists:events,id'],'customer_id'=>['nullable','integer','exists:customers,id'],'payment_id'=>['nullable','integer','exists:payments,id']]; } }