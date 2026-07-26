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

            'status'=>$this->status,

            'role'=>[
                'id'=>$this->role->id,
                'name'=>$this->role->name,
                'slug'=>$this->role->slug
            ],

            'partner'=>$this->partner,

        ];

    }

}