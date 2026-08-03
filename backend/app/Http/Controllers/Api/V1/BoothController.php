<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class BoothController extends Controller
{
    public function __construct(
        protected BoothService $service
    ){}


    public function index(
        BoothIndexRequest $request
    )
    {
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
    )
    {
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
    )
    {
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
    )
    {
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
    )
    {
        $this->authorize(
            'delete',
            $booth
        );

        $this->service->destroy(
            $booth
        );

        return response()->json([

            'message'=>

            'Booth deleted successfully.'

        ]);
    }
}
