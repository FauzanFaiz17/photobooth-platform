<?php
namespace App\Http\Requests\Desktop;
use Illuminate\Foundation\Http\FormRequest;
class StoreMediaRequest extends FormRequest { public function authorize(): bool { return true; } public function rules(): array { return ['type'=>['required','string','in:original,edited,template,gif,video,thumbnail,ai_generated'],'filename'=>['required','string','max:255'],'mime_type'=>['required','string','max:100'],'data_url'=>['required','string'],'width'=>['nullable','integer'],'height'=>['nullable','integer']]; } }