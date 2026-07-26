<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService
{

    public function login(array $data,$ip)
    {

        $user=User::with([
            'role',
            'partner'
        ])
        ->where('email',$data['email'])
        ->first();

        if(!$user){

            return [
                'success'=>false,
                'message'=>'Email tidak ditemukan'
            ];

        }

        if(!Hash::check($data['password'],$user->password)){

            return [
                'success'=>false,
                'message'=>'Password salah'
            ];

        }

        if($user->status!='active'){

            return [
                'success'=>false,
                'message'=>'User tidak aktif'
            ];

        }

        $token=$user->createToken('API Token')->plainTextToken;

        $user->update([
            'last_login_at'=>now(),
            'last_login_ip'=>$ip
        ]);

        return [

            'success'=>true,

            'message'=>'Login berhasil',

            'token'=>$token,

            'user'=>$user

        ];

    }

}