<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\CustomerIndexRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Services\CustomerService;

class CustomerController extends Controller
{
    public function __construct(protected CustomerService $service) {}

    public function index(CustomerIndexRequest $request)
    {
        $this->authorize('viewAny', Customer::class);

        return CustomerResource::collection(
            $this->service->index($request->validated(), $request->user())
        );
    }

    public function show(Customer $customer)
    {
        $this->authorize('view', $customer);

        return new CustomerResource($customer->loadCount('photoSessions'));
    }
}
