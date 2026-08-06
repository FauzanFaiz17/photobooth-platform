<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Configuration\ConfigurationIndexRequest;
use App\Http\Requests\Configuration\FilterRequest;
use App\Http\Resources\FilterResource;
use App\Models\Filter;
use App\Services\Configuration\FilterService;
use App\Support\ApiResponse;

class FilterController extends Controller
{
    public function __construct(protected FilterService $service) {}

    public function index(ConfigurationIndexRequest $request)
    {
        $this->authorize('viewAny', Filter::class);

        return FilterResource::collection(
            $this->service->index($request->validated(), $request->user())
        );
    }

    public function store(FilterRequest $request)
    {
        $this->authorize('create', Filter::class);

        return (new FilterResource(
            $this->service->store($request->validated(), $request->user())
        ))->response()->setStatusCode(201);
    }

    public function show(Filter $filter)
    {
        $this->authorize('view', $filter);

        return new FilterResource($this->service->show($filter));
    }

    public function update(FilterRequest $request, Filter $filter)
    {
        $this->authorize('update', $filter);

        return new FilterResource(
            $this->service->update(
                $filter,
                $request->validated(),
                $request->user()
            )
        );
    }

    public function destroy(Filter $filter)
    {
        $this->authorize('delete', $filter);
        $this->service->destroy($filter);

        return ApiResponse::success(null, 'Filter deleted successfully.');
    }
}
