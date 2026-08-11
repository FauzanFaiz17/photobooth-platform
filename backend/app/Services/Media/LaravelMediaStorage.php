<?php

namespace App\Services\Media;

use App\Contracts\MediaStorage;
use Illuminate\Support\Facades\Storage;

class LaravelMediaStorage implements MediaStorage
{
    public function put(string $path, string $contents): bool
    {
        return Storage::disk($this->diskName())->put($path, $contents, [
            'visibility' => 'private',
        ]);
    }

    public function delete(string $path): bool
    {
        return Storage::disk($this->diskName())->delete($path);
    }

    public function readStream(string $path)
    {
        return Storage::disk($this->diskName())->readStream($path);
    }

    public function diskName(): string
    {
        return config('media.disk', 'local');
    }

    public function bucketName(): string
    {
        return config('media.bucket', $this->diskName());
    }
}
