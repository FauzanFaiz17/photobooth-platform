<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Illuminate\Auth\AuthenticationException;


return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        api: __DIR__.'/../routes/api.php',
        health: '/up',
    )
    ->withMiddleware(function ($middleware) {
        $middleware->alias([
            'permission' => \App\Http\Middleware\PermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function ($exceptions) {

        $exceptions->render(function (
            ValidationException $e,
            Request $request
        ) {

            if (!$request->is('api/*')) {
                return null;
            }

            return \App\Support\ApiResponse::error(
                'Validation failed.',
                $e->errors(),
                422
            );

        });

        $exceptions->render(function (
            AuthorizationException $e,
            Request $request
        ) {

            if (!$request->is('api/*')) {
                return null;
            }

            return \App\Support\ApiResponse::error(
                $e->getMessage(),
                null,
                403
            );

        });

        $exceptions->render(function (
            NotFoundHttpException $e,
            Request $request
        ) {

            if (!$request->is('api/*')) {
                return null;
            }

            return \App\Support\ApiResponse::error(
                'Resource not found.',
                null,
                404
            );

        });

        $exceptions->render(function (
            AuthenticationException $e,
            Request $request
        ) {

            if (!$request->is('api/*')) {
                return null;
            }

            return \App\Support\ApiResponse::error(
                'Unauthenticated.',
                null,
                401
            );

        });

        $exceptions->render(function (
            Throwable $e,
            Request $request
        ) {

            if (!$request->is('api/*')) {
                return null;
            }

            return \App\Support\ApiResponse::error(

                app()->isProduction()
                    ? 'Internal Server Error.'
                    : $e->getMessage(),

                null,

                500

            );

        });

    })->create();
