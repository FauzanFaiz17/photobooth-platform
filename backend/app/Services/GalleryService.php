<?php

namespace App\Services;

use App\Contracts\MediaStorage;
use App\Models\DownloadToken;
use App\Models\GalleryView;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GalleryService
{
    public function __construct(protected MediaStorage $storage, protected AuditService $auditService) {}

    public function gallery(string $token, Request $request): DownloadToken
    {
        $downloadToken = $this->validToken($token);

        GalleryView::create([
            'photo_session_id' => $downloadToken->photo_session_id,
            'ip_address' => $request->ip(),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 255),
            'viewed_at' => now(),
        ]);

        return $downloadToken;
    }

    /** @return array{0: DownloadToken, 1: Media, 2: resource} */
    public function download(string $token, Media $media): array
    {
        $downloadToken = $this->validToken($token);

        if ($media->photo_session_id !== $downloadToken->photo_session_id) {
            abort(404, 'Media not found in this gallery.');
        }

        $stream = $this->storage->readStream($media->object_key, $media->bucket);

        if ($stream === false) {
            abort(404, 'Media file is unavailable.');
        }

        DB::transaction(function () use ($downloadToken) {
            DownloadToken::query()
                ->whereKey($downloadToken->id)
                ->lockForUpdate()
                ->increment('download_count', 1, [
                    'last_download_at' => now(),
                ]);
        });

        $this->auditService->record(
            'download',
            null,
            $media,
            'Gallery media downloaded.',
            ['photo_session_id' => $downloadToken->photo_session_id],
            $downloadToken->photoSession?->partner_id
        );

        return [$downloadToken->fresh(), $media, $stream];
    }

    private function validToken(string $token): DownloadToken
    {
        $downloadToken = DownloadToken::query()
            ->with(['photoSession.media'])
            ->where('token', $token)
            ->firstOrFail();

        if ($downloadToken->expires_at->isPast()) {
            abort(410, 'This gallery link has expired.');
        }

        if ($downloadToken->photoSession?->status !== 'completed') {
            abort(404, 'Gallery is not available.');
        }

        return $downloadToken;
    }
}
