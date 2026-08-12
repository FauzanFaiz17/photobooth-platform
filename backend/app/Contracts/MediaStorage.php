<?php

namespace App\Contracts;

interface MediaStorage
{
    public function put(string $path, string $contents): bool;

    public function delete(string $path, ?string $bucket = null): bool;

    /** @return resource|false */
    public function readStream(string $path, ?string $bucket = null);

    public function diskName(): string;

    public function bucketName(): string;
}
