<?php

use App\Http\Middleware\PermissionMiddleware;
use App\Support\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        api: __DIR__.'/../routes/api.php',
        health: '/up',
    )
    ->withSchedule(function (Schedule $schedule) {
        $schedule->command('subscriptions:expire')->hourly();
        $schedule->command('vouchers:expire')->hourly();
        $schedule->command('payments:expire')->everyMinute();
    })
    ->withMiddleware(function ($middleware) {
        $middleware->alias([
            'permission' => PermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function ($exceptions) {

        $exceptions->render(function (
            ValidationException $e,
            Request $request
        ) {

            if (! $request->is('api/*')) {
                return null;
            }

            return ApiResponse::error(
                'Validation failed.',
                $e->errors(),
                422
            );

        });

        $exceptions->render(function (
            AuthorizationException $e,
            Request $request
        ) {

            if (! $request->is('api/*')) {
                return null;
            }

            return ApiResponse::error(
                $e->getMessage(),
                null,
                403
            );

        });

        $exceptions->render(function (
            NotFoundHttpException $e,
            Request $request
        ) {

            if (! $request->is('api/*')) {
                return null;
            }

            return ApiResponse::error(
                'Resource not found.',
                null,
                404
            );

        });

        $exceptions->render(function (
            AuthenticationException $e,
            Request $request
        ) {

            if (! $request->is('api/*')) {
                return null;
            }

            return ApiResponse::error(
                'Unauthenticated.',
                null,
                401
            );

        });

        $exceptions->render(function (
            HttpExceptionInterface $e,
            Request $request
        ) {

            if (! $request->is('api/*')) {
                return null;
            }

            return ApiResponse::error(
                $e->getMessage() ?: 'Request failed.',
                null,
                $e->getStatusCode()
            );

        });

        $exceptions->render(function (
            Throwable $e,
            Request $request
        ) {

            if (! $request->is('api/*')) {
                return null;
            }

            return ApiResponse::error(

                app()->isProduction()
                    ? 'Internal Server Error.'
                    : $e->getMessage(),

                null,

                500

            );

        });

    })->create();
