<?php

namespace App\Jobs;

use App\Mail\GalleryLinkMail;
use App\Models\PhotoSession;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendGalleryLinkEmail implements ShouldQueue
{
    use Dispatchable, Queueable;

    public int $tries = 3;

    public array $backoff = [30, 120];

    public function __construct(protected int $photoSessionId) {}

    public function handle(): void
    {
        $photoSession = PhotoSession::query()
            ->with(['customer', 'downloadAccess'])
            ->find($this->photoSessionId);

        $email = $photoSession?->customer?->email;

        if (! $photoSession || ! $email || ! $photoSession->downloadAccess) {
            return;
        }

        $galleryUrl = rtrim(config('media.gallery_web_base_url'), '/')
            .'/gallery/'.$photoSession->downloadAccess->token;

        Mail::to($email)->send(
            new GalleryLinkMail(
                galleryUrl: $galleryUrl,
                expiresAt: $photoSession->downloadAccess->expires_at->format('d M Y H:i'),
                customerName: $photoSession->customer->name,
            )
        );
    }
}
