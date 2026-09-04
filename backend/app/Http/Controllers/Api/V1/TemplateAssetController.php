<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\MediaStorage;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TemplateAssetController extends Controller
{
    public function __construct(protected MediaStorage $storage) {}

    public function show(Request $request, string $type): StreamedResponse
    {
        $path = (string) $request->query('path');
        abort_unless(str_starts_with($path, 'template/'.$type.'/') && ! str_contains($path, '..'), 404);
        $stream = $this->storage->readStream($path);
        abort_unless(is_resource($stream), 404);
        return response()->stream(function () use ($stream): void { fpassthru($stream); fclose($stream); }, 200, [
            'Content-Type' => $type === 'png' ? 'image/png' : 'image/jpeg',
            'Cache-Control' => 'private, max-age=300',
        ]);
    }
}
