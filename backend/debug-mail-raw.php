<?php

// One-off: verify the raw log mailer transport works at all.
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Mail;

echo 'default mailer: '.config('mail.default').PHP_EOL;

Mail::raw('Plain raw test body', function ($message) {
    $message->to('raw@example.test')->subject('Raw test');
});

echo 'raw mail sent'.PHP_EOL;
