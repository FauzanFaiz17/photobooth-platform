<?php

namespace App\Jobs;

use App\Mail\GalleryLinkMail;
use App\Models\PhotoSession;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

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

        if (! $photoSession) {
            Log::warning('[gallery-mail] Dilewati: photo_session tidak ditemukan.', [
                'photo_session_id' => $this->photoSessionId,
            ]);

            return;
        }

        if (! $email) {
            Log::warning('[gallery-mail] Dilewati: customer tanpa email.', [
                'photo_session_id' => $photoSession->id,
                'customer_id' => $photoSession->customer_id,
            ]);

            return;
        }

        if (! $photoSession->downloadAccess) {
            Log::warning('[gallery-mail] Dilewati: downloadAccess tidak ada.', [
                'photo_session_id' => $photoSession->id,
            ]);

            return;
        }

        $galleryUrl = rtrim((string) config('media.gallery_web_base_url'), '/')
            .'/gallery/'.$photoSession->downloadAccess->token;

        Mail::to($email)->send(
            new GalleryLinkMail(
                galleryUrl: $galleryUrl,
                expiresAt: $photoSession->downloadAccess->expires_at->format('d M Y H:i'),
                customerName: $photoSession->customer->name,
            )
        );

        Log::info('[gallery-mail] Terkirim.', [
            'photo_session_id' => $photoSession->id,
            'to' => $email,
            'gallery_url' => $galleryUrl,
            'mailer' => config('mail.default'),
        ]);
    }

    public function failed(?Throwable $exception): void
    {
        Log::error('[gallery-mail] Job gagal setelah 3 percobaan.', [
            'photo_session_id' => $this->photoSessionId,
            'error' => $exception?->getMessage(),
        ]);
    }
}
