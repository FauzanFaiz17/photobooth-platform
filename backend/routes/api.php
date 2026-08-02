<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\PartnerController;

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/profile', [AuthController::class, 'profile']);
        Route::post('/logout', [AuthController::class, 'logout']);

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

    });

});