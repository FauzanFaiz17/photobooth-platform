<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    /**
     * Runs after the app is booted but before RefreshDatabase/migrate:fresh.
     * A stale bootstrap/cache/config.php can override phpunit.xml force env
     * vars and has previously wiped the photobooth database.
     */
    protected function setUpTraits(): array
    {
        $database = (string) config('database.connections.mysql.database', '');

        if ($database === 'photobooth') {
            throw new RuntimeException(
                'Refusing to run tests against the photobooth database. '.
                'Run `php artisan config:clear` (composer test does this) and ensure '.
                'bootstrap/cache/config.php is absent, then re-run tests.'
            );
        }

        return parent::setUpTraits();
    }
}
