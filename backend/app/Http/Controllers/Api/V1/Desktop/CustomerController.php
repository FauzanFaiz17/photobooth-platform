<?php

namespace App\Http\Controllers\Api\V1\Desktop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Desktop\ResolveCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Services\CustomerService;
use App\Support\ApiResponse;

class CustomerController extends Controller
{
    public function __construct(protected CustomerService $service) {}

    public function resolve(ResolveCustomerRequest $request)
    {
        return ApiResponse::success(
            new CustomerResource(
                $this->service->resolve($request->user(), $request->validated())
            ),
            'Customer resolved.'
        );
    }
}
