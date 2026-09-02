<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class GalleryLinkMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $galleryUrl,
        public string $expiresAt,
        public ?string $customerName = null
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Foto Sesi Photobooth Anda',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.gallery-link',
            with: [
                'galleryUrl' => $this->galleryUrl,
                'expiresAt' => $this->expiresAt,
                'customerName' => $this->customerName,
            ],
        );
    }
}
