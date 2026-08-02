<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Partner;

use App\Services\PartnerService;

use App\Http\Resources\PartnerResource;

use App\Http\Controllers\Controller;

use App\Http\Requests\Partner\StorePartnerRequest;
use App\Http\Requests\Partner\UpdatePartnerRequest;
use App\Http\Requests\Partner\PartnerIndexRequest;

class PartnerController extends Controller
{
    public function __construct(
        protected PartnerService $service
    ) {}

    public function index(
        PartnerIndexRequest $request
    )
    {
        $this->authorize(
            'viewAny',
            Partner::class
        );

        return PartnerResource::collection(

            $this->service->index(
                $request->validated()
            )

        );
    }

    public function show(
        Partner $partner
    )
    {
        $this->authorize(
            'view',
            $partner
        );

        return new PartnerResource(

            $this->service->show($partner)

        );
    }

    public function store(
        StorePartnerRequest $request
    )
    {
        $this->authorize(
            'create',
            Partner::class
        );

        return (new PartnerResource(
            $this->service->store(
                $request->validated()
            )
        ))
        ->response()
        ->setStatusCode(201);
    }

    public function update(
        UpdatePartnerRequest $request,
        Partner $partner
    )
    {
        $this->authorize(
            'update',
            $partner
        );

        return new PartnerResource(

            $this->service->update(
                $partner,
                $request->validated()
            )

        );
    }

    public function destroy(Partner $partner)
    {
        $this->authorize('delete', $partner);

        $this->service->destroy($partner);

        return response()->json([
            'message' => 'Partner deleted successfully.'
        ]);
    }
}