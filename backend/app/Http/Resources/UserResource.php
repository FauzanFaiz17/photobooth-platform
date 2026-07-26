<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{

    public function toArray(Request $request): array
    {
        return [

            'id'=>$this->id,

            'name'=>$this->name,

            'email'=>$this->email,

            'phone'=>$this->phone,

            'avatar'=>$this->avatar_path,

            'status'=>$this->status,

            'last_login_at'=>$this->last_login_at,

            'created_at'=>$this->created_at,

            'role'=>[
                'id'=>$this->role?->id,
                'name'=>$this->role?->name,
                'slug'=>$this->role?->slug
            ],

            'partner'=>$this->partner?[
                'id'=>$this->partner->id,
                'company_name'=>$this->partner->company_name,
                'brand_name'=>$this->partner->brand_name
            ]:null

        ];
    }

}