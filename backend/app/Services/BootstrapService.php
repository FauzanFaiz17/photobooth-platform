<?php

namespace App\Services\Desktop;

use App\Models\User;

class BootstrapService
{

    public function handle(User $user): array
    {

        $user->load([
            'role',
            'partner'
        ]);

        return [

            'user'=>[
                'id'=>$user->id,
                'name'=>$user->name,
                'email'=>$user->email,
            ],

            'role'=>$user->role,

            'partner'=>$user->partner,

            'permissions'=>$user->getPermissionNames(),

            'device'=>null,

            'booth'=>null,

            'active_event'=>null,

            'settings'=>[

                'offline_upload'=>true,

                'auto_print'=>true,

                'app_version'=>'1.0.0'

            ]

        ];

    }

}