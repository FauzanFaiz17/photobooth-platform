<?php

namespace App\Http\Controllers\Api\V1\Desktop;

use App\Http\Controllers\Controller;
use App\Services\Desktop\BootstrapService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class BootstrapController extends Controller
{
    public function __construct(
        protected BootstrapService $bootstrapService
    ) {}

    public function index(Request $request)
    {
        return ApiResponse::success(

            $this->bootstrapService->handle(

                $request->user()

            ),

            'Bootstrap berhasil dimuat'

        );
    }
}