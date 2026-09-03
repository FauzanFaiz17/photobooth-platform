<?php

use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BoothController;
use App\Http\Controllers\Api\V1\CameraProfileController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\Desktop\BootstrapController;
use App\Http\Controllers\Api\V1\Desktop\CustomerController as DesktopCustomerController;
use App\Http\Controllers\Api\V1\Desktop\DeviceController;
use App\Http\Controllers\Api\V1\Desktop\EventConfigurationController;
use App\Http\Controllers\Api\V1\Desktop\HeartbeatController;
use App\Http\Controllers\Api\V1\Desktop\PaymentController as DesktopPaymentController;
use App\Http\Controllers\Api\V1\Desktop\PhotoSessionController;
use App\Http\Controllers\Api\V1\Desktop\PrintJobController as DesktopPrintJobController;
use App\Http\Controllers\Api\V1\Desktop\VoucherController as DesktopVoucherController;
use App\Http\Controllers\Api\V1\DeviceController as ManagementDeviceController;
use App\Http\Controllers\Api\V1\EventController;
use App\Http\Controllers\Api\V1\FilterController;
use App\Http\Controllers\Api\V1\GalleryController;
use App\Http\Controllers\Api\V1\MidtransNotificationController;
use App\Http\Controllers\Api\V1\PartnerController;
use App\Http\Controllers\Api\V1\PartnerSubscriptionController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PlatformCredentialController;
use App\Http\Controllers\Api\V1\PrinterController;
use App\Http\Controllers\Api\V1\PrinterProfileController;
use App\Http\Controllers\Api\V1\PrintJobController;
// khusus desktop
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\SubscriptionPlanController;
use App\Http\Controllers\Api\V1\TemplateController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\VoucherController;
use App\Http\Controllers\Api\V1\VoucherPackageController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    Route::get('/health', fn () => response()->json([
        'success' => true,
        'message' => 'API is healthy.',
        'data' => ['status' => 'ok'],
    ]));

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/payments/midtrans/notification', [MidtransNotificationController::class, 'store']);
    Route::get('/gallery/{token}', [GalleryController::class, 'show'])
        ->where('token', '[A-Za-z0-9]{64}')
        ->middleware('throttle:60,1')
        ->name('gallery.show');
    Route::get('/gallery/{token}/media/{media}', [GalleryController::class, 'download'])
        ->where('token', '[A-Za-z0-9]{64}')
        ->whereNumber('media')
        ->middleware('throttle:30,1')
        ->name('gallery.media.download');
    // Route::post('/devices/verify', [DeviceController::class, 'verify']);

    // khusus dekstop
    Route::middleware('auth:sanctum')
        ->prefix('desktop')
        ->group(function () {

            Route::get('/bootstrap', [BootstrapController::class, 'index']);
            Route::post('/devices/heartbeat', [HeartbeatController::class, 'store']);
            Route::post('/customers/resolve', [DesktopCustomerController::class, 'resolve']);
            Route::post('/vouchers/redeem', [DesktopVoucherController::class, 'redeem']);
            Route::post('/payments', [DesktopPaymentController::class, 'store']);
            Route::get('/payments/{payment}', [DesktopPaymentController::class, 'show']);
            Route::get('/print-jobs', [DesktopPrintJobController::class, 'index']);
            Route::post('/print-jobs/{printJob}/status', [DesktopPrintJobController::class, 'update']);
            Route::get('/print-jobs/{printJob}/media', [DesktopPrintJobController::class, 'media'])
                ->name('desktop.print-jobs.media');
            Route::post('/photo-sessions', [PhotoSessionController::class, 'store']);
            Route::post('/photo-sessions/{photoSession}/media', [PhotoSessionController::class, 'media']);
            Route::post('/photo-sessions/{photoSession}/complete', [PhotoSessionController::class, 'complete']);
            Route::get('/events/{eventCode}/configuration', [EventConfigurationController::class, 'show']);

        });

    Route::prefix('desktop')->group(function () {

        Route::post('/devices/verify', [DeviceController::class, 'verify']);
        Route::post('/devices/activate', [DeviceController::class, 'activate'])
            ->middleware('throttle:device-activation');

    });

    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/profile', [AuthController::class, 'profile']);
        Route::post('/verify-password', [AuthController::class, 'verifyPassword'])->middleware('throttle:10,1');
        Route::post('/logout', [AuthController::class, 'logout']);

        Route::apiResources([
            'templates' => TemplateController::class,
            'filters' => FilterController::class,
            'camera-profiles' => CameraProfileController::class,
            'printer-profiles' => PrinterProfileController::class,
            'events' => EventController::class,
            'devices' => ManagementDeviceController::class,
        ]);
        Route::post('/templates/{template}/assets', [TemplateController::class, 'uploadAsset']);
        Route::post('/devices/{device}/regenerate-activation', [ManagementDeviceController::class, 'regenerateActivation']);
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

            Route::delete('/{user}', [UserController::class, 'destroy'])
                ->middleware('permission:users.delete');

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

        Route::prefix('partner-subscriptions')->group(function () {
            Route::get('/', [PartnerSubscriptionController::class, 'index'])
                ->middleware('permission:subscriptions.view');
            Route::get('/{partnerSubscription}', [PartnerSubscriptionController::class, 'show'])
                ->middleware('permission:subscriptions.view');
            Route::post('/', [PartnerSubscriptionController::class, 'store'])
                ->middleware('permission:subscriptions.create');
            Route::post('/{partnerSubscription}/activate', [PartnerSubscriptionController::class, 'activate'])
                ->middleware('permission:subscriptions.update');
            Route::post('/{partnerSubscription}/renew', [PartnerSubscriptionController::class, 'renew'])
                ->middleware('permission:subscriptions.update');
            Route::post('/{partnerSubscription}/cancel', [PartnerSubscriptionController::class, 'cancel'])
                ->middleware('permission:subscriptions.update');
            Route::post('/{partnerSubscription}/expire', [PartnerSubscriptionController::class, 'expire'])
                ->middleware('permission:subscriptions.update');
        });

        Route::prefix('customers')->group(function () {
            Route::get('/', [CustomerController::class, 'index'])
                ->middleware('permission:customers.view');
            Route::get('/{customer}', [CustomerController::class, 'show'])
                ->middleware('permission:customers.view');
        });

        Route::apiResource('voucher-packages', VoucherPackageController::class)
            ->middlewareFor(['index', 'show'], 'permission:vouchers.view')
            ->middlewareFor('store', 'permission:vouchers.create')
            ->middlewareFor('update', 'permission:vouchers.update')
            ->middlewareFor('destroy', 'permission:vouchers.delete');

        Route::prefix('vouchers')->group(function () {
            Route::get('/', [VoucherController::class, 'index'])
                ->middleware('permission:vouchers.view');
            Route::post('/', [VoucherController::class, 'store'])
                ->middleware('permission:vouchers.create');
            Route::get('/{voucher}', [VoucherController::class, 'show'])
                ->middleware('permission:vouchers.view');
            Route::post('/{voucher}/void', [VoucherController::class, 'void'])
                ->middleware('permission:vouchers.update');
        });

        Route::prefix('payments')->group(function () {
            Route::get('/', [PaymentController::class, 'index'])
                ->middleware('permission:payments.view');
            Route::get('/{payment}', [PaymentController::class, 'show'])
                ->middleware('permission:payments.view');
            Route::post('/{payment}/transition', [PaymentController::class, 'transition'])
                ->middleware('permission:payments.update');
        });

        Route::prefix('reports')->group(function () {
            Route::get('/daily', [ReportController::class, 'daily']);
            Route::get('/monthly', [ReportController::class, 'monthly']);
            Route::get('/admin/daily', [ReportController::class, 'adminDaily']);
        });
        Route::get('/audit-logs', [AuditLogController::class, 'index']);

        Route::prefix('platform-settings')->group(function () {
            Route::get('/midtrans', [PlatformCredentialController::class, 'midtrans']);
            Route::put('/midtrans', [PlatformCredentialController::class, 'updateMidtrans'])->middleware('throttle:10,1');
            Route::post('/midtrans/test', [PlatformCredentialController::class, 'testMidtrans'])->middleware('throttle:10,1');
            Route::delete('/midtrans', [PlatformCredentialController::class, 'clearMidtrans'])->middleware('throttle:10,1');
            Route::get('/r2', [PlatformCredentialController::class, 'r2']);
            Route::put('/r2', [PlatformCredentialController::class, 'updateR2'])->middleware('throttle:10,1');
            Route::post('/r2/test', [PlatformCredentialController::class, 'testR2'])->middleware('throttle:10,1');
            Route::delete('/r2', [PlatformCredentialController::class, 'clearR2'])->middleware('throttle:10,1');
        });

        Route::apiResource('printers', PrinterController::class)
            ->middlewareFor(['index', 'show'], 'permission:printers.view')
            ->middlewareFor('store', 'permission:printers.create')
            ->middlewareFor('update', 'permission:printers.update')
            ->middlewareFor('destroy', 'permission:printers.delete');

        Route::prefix('print-jobs')->group(function () {
            Route::get('/', [PrintJobController::class, 'index'])->middleware('permission:print_jobs.view');
            Route::post('/', [PrintJobController::class, 'store'])->middleware('permission:print_jobs.create');
            Route::get('/{printJob}', [PrintJobController::class, 'show'])->middleware('permission:print_jobs.view');
            Route::post('/{printJob}/transition', [PrintJobController::class, 'transition'])->middleware('permission:print_jobs.update');
            Route::post('/{printJob}/retry', [PrintJobController::class, 'retry'])->middleware('permission:print_jobs.update');
        });

        Route::prefix('booths')->group(function () {

            Route::get(
                '/',
                [BoothController::class, 'index']
            )->middleware('permission:booths.view');

            Route::get(
                '/{booth}',
                [BoothController::class, 'show']
            )->middleware('permission:booths.view');

            Route::post(
                '/',
                [BoothController::class, 'store']
            )->middleware('permission:booths.create');

            Route::put(
                '/{booth}',
                [BoothController::class, 'update']
            )->middleware('permission:booths.update');

            Route::delete(
                '/{booth}',
                [BoothController::class, 'destroy']
            )->middleware('permission:booths.delete');

        });

    });

});
