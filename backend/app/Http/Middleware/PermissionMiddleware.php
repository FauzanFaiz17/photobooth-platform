<?php

namespace App\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    public function handle(
        Request $request,
        Closure $next,
        string $permission
    ): Response {

        $user = $request->user();

        if (! $user) {

            return ApiResponse::error('Unauthenticated.', null, 401);

        }

        if (! $user->hasPermission($permission)) {

            return ApiResponse::error(
                'You do not have permission.',
                null,
                403
            );

        }

        return $next($request);
    }
}
