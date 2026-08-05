<?php

namespace App\Http\Controllers\Api\V1\Desktop;

use App\Http\Controllers\Controller;

use App\Http\Requests\Desktop\BootstrapRequest;

use App\Http\Resources\Desktop\BootstrapResource;

use App\Services\Desktop\BootstrapService;

use App\Support\ApiResponse;

class BootstrapController extends Controller
{
    public function __construct(
        protected BootstrapService $bootstrapService
    ) {}

    public function index(
        BootstrapRequest $request
    ) {

        $bootstrap = $this->bootstrapService
            ->handle(

                $request->user(),

                $request->deviceUuid()

            );

        return ApiResponse::success(

            new BootstrapResource(
                $bootstrap
            ),

            'Bootstrap berhasil dimuat.'

        );

    }
}