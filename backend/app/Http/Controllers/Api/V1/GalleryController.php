<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\GalleryResource;
use App\Models\Media;
use App\Services\GalleryService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class GalleryController extends Controller
{
    public function __construct(protected GalleryService $service) {}

    public function show(Request $request, string $token)
    {
        return ApiResponse::success(
            new GalleryResource($this->service->gallery($token, $request)),
            'Gallery retrieved.'
        );
    }

    public function download(string $token, Media $media): StreamedResponse
    {
        [, $media, $stream] = $this->service->download($token, $media);

        return response()->streamDownload(function () use ($stream) {
            fpassthru($stream);
            fclose($stream);
        }, $media->filename, [
            'Content-Type' => $media->mime_type,
            'Content-Length' => (string) $media->size_bytes,
            'Cache-Control' => 'private, no-store',
        ]);
    }
}
