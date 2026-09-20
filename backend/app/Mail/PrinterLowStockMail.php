<?php

namespace App\Mail;

use App\Models\Printer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PrinterLowStockMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Printer $printer,
        public int $remainingPrints,
        public int $threshold,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Peringatan: Stok Cetakan Habis - {$this->printer->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.printer-low-stock',
            with: [
                'printerName' => $this->printer->name,
                'boothName' => $this->printer->booth?->name ?? '-',
                'partnerName' => $this->printer->partner?->company_name ?? '-',
                'remainingPrints' => $this->remainingPrints,
                'threshold' => $this->threshold,
            ],
        );
    }
}
