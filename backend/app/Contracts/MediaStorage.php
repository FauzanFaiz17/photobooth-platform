<?php

namespace App\Contracts;

interface MediaStorage
{
    public function put(string $path, string $contents): bool;

    public function delete(string $path): bool;

    /** @return resource|false */
    public function readStream(string $path);

    public function diskName(): string;

    public function bucketName(): string;
}
