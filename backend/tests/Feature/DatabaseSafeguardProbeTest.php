<?php

namespace Tests\Feature;

use RuntimeException;
use Tests\TestCase;

class DatabaseSafeguardProbeTest extends TestCase
{
    public function test_refuses_photobooth_database(): void
    {
        config(['database.connections.mysql.database' => 'photobooth']);

        try {
            $this->setUpTraits();
            $this->fail('Expected RuntimeException when database is photobooth.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('Refusing to run tests against the photobooth database', $e->getMessage());
        }
    }
}
