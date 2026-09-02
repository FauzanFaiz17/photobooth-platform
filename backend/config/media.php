<?php

return [
    'disk' => env('MEDIA_DISK', 'local'),
    'bucket' => env('MEDIA_BUCKET', env('MEDIA_DISK', 'local')),
    'gallery_token_ttl_days' => (int) env('GALLERY_TOKEN_TTL_DAYS', 30),

    // Public base URL of the customer-facing gallery web app.
    // The backend builds QR/email gallery links from this, so customers
    // land on the web page, not on a JSON API endpoint.
    'gallery_web_base_url' => env('GALLERY_WEB_BASE_URL', 'http://localhost:5173'),
];
