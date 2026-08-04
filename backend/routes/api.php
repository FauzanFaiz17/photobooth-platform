<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\PartnerController;
use App\Http\Controllers\Api\V1\EventController;

// khsus desktop
use App\Http\Controllers\Api\V1\Desktop\BootstrapController;
use App\Http\Controllers\Api\V1\Desktop\DeviceController;

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */
    Route::post('/login', [AuthController::class, 'login']);
    // Route::post('/devices/verify', [DeviceController::class, 'verify']);


    // khusus dekstop
    Route::middleware('auth:sanctum')
        ->prefix('desktop')
        ->group(function () {

            Route::get('/bootstrap', [BootstrapController::class, 'index']);

        });

    Route::prefix('v1/desktop')->group(function () {

        Route::post('/devices/verify', [DeviceController::class, 'verify']);

    });

    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/profile', [AuthController::class, 'profile']);
        Route::post('/logout', [AuthController::class, 'logout']);


        // untuk event
        Route::prefix('events')->group(function () {

            // Route::get('/', ...);

            // Route::get('{event}', ...);

            // Route::post('/', ...);

            // Route::put('{event}', ...);

            // Route::delete('{event}', ...);

        });
        /*
        |--------------------------------------------------------------------------
        | Users
        |--------------------------------------------------------------------------
        */
        Route::prefix('users')->group(function () {

            Route::get('/', [UserController::class, 'index'])
                ->middleware('permission:users.view');

            Route::get('/{user}', [UserController::class, 'show'])
                ->middleware('permission:users.view');

            Route::post('/', [UserController::class, 'store'])
                ->middleware('permission:users.create');

            Route::put('/{user}', [UserController::class, 'update'])
                ->middleware('permission:users.update');

        });

        Route::prefix('partners')->group(function () {

            Route::get('/', [PartnerController::class, 'index'])
                ->middleware('permission:partners.view');

            Route::get('/{partner}', [PartnerController::class, 'show'])
                ->middleware('permission:partners.view');

            Route::post('/', [PartnerController::class, 'store'])
                ->middleware('permission:partners.create');

            Route::put('/{partner}', [PartnerController::class, 'update'])
                ->middleware('permission:partners.update');

            Route::delete('/{partner}', [PartnerController::class, 'destroy'])
                ->middleware('permission:partners.delete');
        });

        Route::prefix('subscription-plans')->group(function () {

            Route::get('/', [SubscriptionPlanController::class, 'index'])
                ->middleware('permission:subscriptions.view');

            Route::get('/{subscriptionPlan}', [SubscriptionPlanController::class, 'show'])
                ->middleware('permission:subscriptions.view');

            Route::post('/', [SubscriptionPlanController::class, 'store'])
                ->middleware('permission:subscriptions.create');

            Route::put('/{subscriptionPlan}', [SubscriptionPlanController::class, 'update'])
                ->middleware('permission:subscriptions.update');

            Route::delete('/{subscriptionPlan}', [SubscriptionPlanController::class, 'destroy'])
                ->middleware('permission:subscriptions.delete');
        });

        Route::prefix('booths')->group(function () {

            Route::get(
                '/',
                [BoothController::class,'index']
            )->middleware('permission:booths.view');

            Route::get(
                '/{booth}',
                [BoothController::class,'show']
            )->middleware('permission:booths.view');

            Route::post(
                '/',
                [BoothController::class,'store']
            )->middleware('permission:booths.create');

            Route::put(
                '/{booth}',
                [BoothController::class,'update']
            )->middleware('permission:booths.update');

            Route::delete(
                '/{booth}',
                [BoothController::class,'destroy']
            )->middleware('permission:booths.delete');

        });

    });

});