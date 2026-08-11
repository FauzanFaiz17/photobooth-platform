<?php

return [
    'online_after_seconds' => (int) env('DEVICE_ONLINE_AFTER_SECONDS', 120),
    'offline_after_seconds' => (int) env('DEVICE_OFFLINE_AFTER_SECONDS', 900),
];
