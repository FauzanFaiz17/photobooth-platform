<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Services\AuditService;
use App\Services\AuthService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService, protected AuditService $auditService)
    {
        $this->authService = $authService;
    }

    public function login(LoginRequest $request)
    {

        $result = $this->authService->login(
            $request->validated(),
            $request->ip()
        );

        if (! $result['success']) {
            return ApiResponse::error($result['message'], null, 401);

        }

        $this->auditService->record('login', $result['user'], $result['user'], 'User logged in.', [
            'client' => $request->filled('device_uuid') ? 'desktop' : 'web',
        ]);

        return ApiResponse::success([
            'token' => $result['token'],
            'user' => new UserResource($result['user']),
        ], $result['message']);

    }

    public function profile(Request $request)
    {

        return ApiResponse::success(
            new UserResource($request->user()->load([
                'role',
                'partner',
            ])),
            'Profile loaded.'
        );

    }

    public function logout(Request $request)
    {

        $user = $request->user();
        $this->auditService->record('logout', $user, $user, 'User logged out.');
        $user
            ->currentAccessToken()
            ->delete();

        return ApiResponse::success(null, 'Logout berhasil');

    }
}
