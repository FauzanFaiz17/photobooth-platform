<?php

// One-off debug script: reproduces the desktop complete call against local server.
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;

$session = App\Models\PhotoSession::latest('id')->first();
echo 'SESSION: '.$session->id.' status='.$session->status.PHP_EOL;

$device = App\Models\Device::find($session->device_id);
$user = App\Models\User::find($session->operator_id);

$token = $user->createToken('debug-complete')->plainTextToken;

$baseUrl = 'http://127.0.0.1:8000/api';
$url = $baseUrl.'/v1/desktop/photo-sessions/'.$session->id.'/complete';
echo 'URL: '.$url.PHP_EOL;

$response = Http::withToken($token)
    ->withHeaders(['X-Device-UUID' => $device->device_uuid, 'Accept' => 'application/json'])
    ->post($url, [
        'printed_locally' => true,
    ]);

echo 'STATUS: '.$response->status().PHP_EOL;
echo substr($response->body(), 0, 800).PHP_EOL;
