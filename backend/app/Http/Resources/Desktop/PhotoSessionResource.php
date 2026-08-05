<?php
namespace App\Http\Resources\Desktop;
use Illuminate\Http\Request; use Illuminate\Http\Resources\Json\JsonResource;
class PhotoSessionResource extends JsonResource { public function toArray(Request $request): array { return ['id'=>$this->id,'status'=>$this->status,'download_token'=>$this->download_token,'started_at'=>$this->started_at,'completed_at'=>$this->completed_at,'media'=>$this->whenLoaded('media',fn()=> $this->media->map(fn($m)=>['id'=>$m->id,'type'=>$m->type,'filename'=>$m->filename,'mime_type'=>$m->mime_type,'size_bytes'=>$m->size_bytes,'object_key'=>$m->object_key]))]; } }