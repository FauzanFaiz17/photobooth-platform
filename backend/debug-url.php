<?php
$urls = [
    'http://localhost/photobooth-platform/backend/public/index.php',
    'http://localhost/backend/public/',
    'http://localhost/photobooth-platform/backend/public/',
];
foreach ($urls as $url) {
    $headers = @get_headers($url);
    echo $url.' => '.($headers ? $headers[0] : 'FAIL').PHP_EOL;
}
