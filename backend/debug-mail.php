<?php

// One-off: verify queued mail renders and is written by the log mailer.
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Mail\GalleryLinkMail;
use Illuminate\Support\Facades\Mail;

try {
    $mail = new GalleryLinkMail(
        galleryUrl: 'http://localhost:5173/gallery/TESTTOKEN',
        expiresAt: '01 Okt 2026 07:00',
        customerName: 'Fauzan'
    );

    $rendered = $mail->render();
    echo 'RENDER OK, length: '.strlen($rendered).PHP_EOL;

    Mail::to('fauzan@example.test')->send($mail);
    echo 'mail sent to log. Check storage/logs/laravel.log'.PHP_EOL;
} catch (Throwable $e) {
    echo 'FAILED: '.get_class($e).': '.$e->getMessage().PHP_EOL;
}
