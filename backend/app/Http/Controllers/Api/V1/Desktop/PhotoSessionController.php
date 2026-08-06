<?php

namespace App\Http\Controllers\Api\V1\Desktop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Desktop\CompletePhotoSessionRequest;
use App\Http\Requests\Desktop\StoreMediaRequest;
use App\Http\Requests\Desktop\StorePhotoSessionRequest;
use App\Http\Resources\Desktop\MediaResource;
use App\Http\Resources\Desktop\PhotoSessionResource;
use App\Models\PhotoSession;
use App\Services\Desktop\PhotoSessionService;
use App\Support\ApiResponse;

class PhotoSessionController extends Controller
{
    public function __construct(
        protected PhotoSessionService $photoSessionService
    ) {}

    public function store(StorePhotoSessionRequest $request)
    {
        $photoSession = $this->photoSessionService->create(
            $request->user(),
            $request->deviceUuid(),
            $request->safe()->except('device_uuid')
        );

        return ApiResponse::success(
            new PhotoSessionResource($photoSession),
            'Photo session created.',
            201
        );
    }

    public function media(
        StoreMediaRequest $request,
        PhotoSession $photoSession
    ) {
        $media = $this->photoSessionService->storeMedia(
            $photoSession,
            $request->user(),
            $request->deviceUuid(),
            $request->safe()->except('device_uuid')
        );

        return ApiResponse::success(
            new MediaResource($media),
            'Media uploaded.',
            201
        );
    }

    public function complete(
        CompletePhotoSessionRequest $request,
        PhotoSession $photoSession
    ) {
        $photoSession = $this->photoSessionService->complete(
            $photoSession,
            $request->user(),
            $request->deviceUuid()
        );

        return ApiResponse::success(
            new PhotoSessionResource($photoSession),
            'Photo session completed.'
        );
    }
}
