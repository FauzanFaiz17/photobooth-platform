<?php

namespace App\Services\Media;

use App\Contracts\MediaStorage;
use App\Services\PlatformCredentialService;
use Illuminate\Support\Facades\Storage;

class LaravelMediaStorage implements MediaStorage
{
    public function __construct(protected PlatformCredentialService $credentials) {}

    public function put(string $path, string $contents): bool
    {
        return $this->disk()->put($path, $contents, [
            'visibility' => 'private',
        ]);
    }

    public function delete(string $path, ?string $bucket = null): bool
    {
        return $this->disk($bucket)->delete($path);
    }

    public function readStream(string $path, ?string $bucket = null)
    {
        return $this->disk($bucket)->readStream($path);
    }

    public function diskName(): string
    {
        return $this->credentials->r2()['enabled'] ? 'r2' : config('media.disk', 'local');
    }

    public function bucketName(): string
    {
        return $this->diskName() === 'r2'
            ? $this->credentials->r2()['bucket']
            : config('media.bucket', $this->diskName());
    }

    private function disk(?string $bucket = null)
    {
        if ($bucket === 'local') {
            return Storage::disk('local');
        }

        if ($bucket) {
            $config = $this->credentials->r2();
            $config['bucket'] = $bucket;

            return $this->credentials->r2Disk($config);
        }

        if ($this->diskName() === 'r2') {
            $config = $this->credentials->r2();

            return $config['source'] === 'database'
                ? $this->credentials->r2Disk($config)
                : Storage::disk('r2');
        }

        return Storage::disk($this->diskName());
    }
}
