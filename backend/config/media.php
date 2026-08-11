<?php

return [
    'disk' => env('MEDIA_DISK', 'local'),
    'bucket' => env('MEDIA_BUCKET', env('MEDIA_DISK', 'local')),
    'gallery_token_ttl_days' => (int) env('GALLERY_TOKEN_TTL_DAYS', 30),
];
