<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Booth\BoothIndexRequest;
use App\Http\Requests\Booth\StoreBoothRequest;
use App\Http\Requests\Booth\UpdateBoothRequest;
use App\Http\Resources\BoothResource;
use App\Models\Booth;
use App\Services\BoothService;
use App\Support\ApiResponse;

class BoothController extends Controller
{
    public function __construct(
        protected BoothService $service
    ) {}

    public function index(
        BoothIndexRequest $request
    ) {
        $this->authorize(
            'viewAny',
            Booth::class
        );

        return BoothResource::collection(

            $this->service->index(
                $request->validated(),
                $request->user()
            )

        );
    }

    public function show(
        Booth $booth
    ) {
        $this->authorize(
            'view',
            $booth
        );

        return new BoothResource(

            $this->service->show($booth)

        );
    }

    public function store(
        StoreBoothRequest $request
    ) {
        $this->authorize(
            'create',
            Booth::class
        );

        return (new BoothResource(

            $this->service->store(

                $request->validated(),

                $request->user()

            )

        ))
            ->response()
            ->setStatusCode(201);
    }

    public function update(
        UpdateBoothRequest $request,
        Booth $booth
    ) {
        $this->authorize(
            'update',
            $booth
        );

        return new BoothResource(

            $this->service->update(

                $booth,

                $request->validated(),

                $request->user()

            )

        );
    }

    public function destroy(
        Booth $booth
    ) {
        $this->authorize(
            'delete',
            $booth
        );

        $this->service->destroy(
            $booth
        );

        return ApiResponse::success(
            null,
            'Booth deleted successfully.'
        );
    }
}
