<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{

    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService=$authService;
    }

    public function login(LoginRequest $request)
    {

        $result=$this->authService->login(
            $request->validated(),
            $request->ip()
        );

        if(!$result['success']){

            return response()->json($result,401);

        }

        return response()->json([

            'success'=>true,

            'message'=>$result['message'],

            'token'=>$result['token'],

            'user'=>new UserResource($result['user'])

        ]);

    }

    public function me(Request $request)
    {

        return new UserResource(

            $request->user()->load([
                'role',
                'partner'
            ])

        );

    }

    public function logout(Request $request)
    {

        $request->user()
            ->currentAccessToken()
            ->delete();

        return response()->json([

            'success'=>true,

            'message'=>'Logout berhasil'

        ]);

    }

}