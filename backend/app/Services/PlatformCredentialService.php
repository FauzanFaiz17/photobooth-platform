<?php

namespace App\Services;

use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PlatformCredentialService
{
    public const MIDTRANS_KEY = 'credentials.midtrans';

    public const R2_KEY = 'credentials.r2';

    public function midtrans(): array
    {
        $stored = $this->stored(self::MIDTRANS_KEY);
        $production = (bool) ($stored['production'] ?? config('services.midtrans.production', false));

        return [
            'merchant_id' => $stored['merchant_id'] ?? null,
            'client_key' => $stored['client_key'] ?? config('services.midtrans.client_key'),
            'server_key' => $stored['server_key'] ?? config('services.midtrans.server_key'),
            'production' => $production,
            'api_url' => $stored['api_url'] ?? ($production
                ? 'https://api.midtrans.com'
                : 'https://api.sandbox.midtrans.com'),
            'timeout' => (int) ($stored['timeout'] ?? config('services.midtrans.timeout', 15)),
            'qris_enabled' => (bool) ($stored['qris_enabled'] ?? true),
            'source' => $stored ? 'database' : 'environment',
            'updated_at' => $this->updatedAt(self::MIDTRANS_KEY),
        ];
    }

    public function r2(): array
    {
        $stored = $this->stored(self::R2_KEY);

        return [
            'access_key_id' => $stored['access_key_id'] ?? config('filesystems.disks.r2.key'),
            'secret_access_key' => $stored['secret_access_key'] ?? config('filesystems.disks.r2.secret'),
            'bucket' => $stored['bucket'] ?? config('media.bucket') ?? config('filesystems.disks.r2.bucket'),
            'endpoint' => $stored['endpoint'] ?? config('filesystems.disks.r2.endpoint'),
            'region' => $stored['region'] ?? config('filesystems.disks.r2.region', 'auto'),
            'use_path_style_endpoint' => (bool) ($stored['use_path_style_endpoint'] ?? true),
            'enabled' => (bool) ($stored['enabled'] ?? config('media.disk') === 'r2'),
            'source' => $stored ? 'database' : 'environment',
            'updated_at' => $this->updatedAt(self::R2_KEY),
        ];
    }

    public function updateMidtrans(array $data, User $user): array
    {
        $current = $this->stored(self::MIDTRANS_KEY);
        $production = (bool) $data['production'];
        $payload = [
            'merchant_id' => $data['merchant_id'],
            'client_key' => $data['client_key'] ?? $current['client_key'] ?? null,
            'server_key' => $data['server_key'] ?? $current['server_key'] ?? null,
            'production' => $production,
            'api_url' => $production ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com',
            'timeout' => $data['timeout'] ?? 15,
            'qris_enabled' => $data['qris_enabled'] ?? true,
        ];
        $this->requireSecrets($payload, ['client_key', 'server_key']);
        $this->save(self::MIDTRANS_KEY, $payload, $user);

        return $this->midtrans();
    }

    public function updateR2(array $data, User $user): array
    {
        $current = $this->stored(self::R2_KEY);
        $payload = [
            'access_key_id' => $data['access_key_id'] ?? $current['access_key_id'] ?? null,
            'secret_access_key' => $data['secret_access_key'] ?? $current['secret_access_key'] ?? null,
            'bucket' => $data['bucket'],
            'endpoint' => rtrim($data['endpoint'], '/'),
            'region' => $data['region'] ?? 'auto',
            'use_path_style_endpoint' => $data['use_path_style_endpoint'] ?? true,
            'enabled' => $data['enabled'] ?? false,
        ];
        $this->requireSecrets($payload, ['access_key_id', 'secret_access_key']);
        $this->save(self::R2_KEY, $payload, $user);

        return $this->r2();
    }

    public function testMidtrans(): array
    {
        $config = $this->midtrans();
        $this->requireSecrets($config, ['server_key']);

        try {
            $response = Http::withBasicAuth($config['server_key'], '')
                ->acceptJson()
                ->timeout($config['timeout'])
                ->get($config['api_url'].'/v2/photobooth-credential-check/status');
        } catch (ConnectionException) {
            abort(502, 'Midtrans could not be reached.');
        }

        if (in_array($response->status(), [401, 403], true)) {
            throw ValidationException::withMessages(['server_key' => 'Midtrans rejected the credential.']);
        }

        if (! in_array($response->status(), [200, 404], true)) {
            abort(502, 'Midtrans returned an unexpected response while testing the credential.');
        }

        return ['connected' => true, 'http_status' => $response->status()];
    }

    public function testR2(): array
    {
        $config = $this->r2();
        $this->requireSecrets($config, ['access_key_id', 'secret_access_key', 'bucket', 'endpoint']);

        try {
            $reachable = $this->r2Disk($config)->exists('.photobooth-health-check');
        } catch (\Throwable $exception) {
            report($exception);
            abort(502, 'Cloudflare R2 could not be reached with the configured credential.');
        }

        return ['connected' => true, 'health_check_object_exists' => $reachable];
    }

    public function clearMidtrans(): void
    {
        PlatformSetting::query()->where('key', self::MIDTRANS_KEY)->delete();
    }

    public function clearR2(): void
    {
        PlatformSetting::query()->where('key', self::R2_KEY)->delete();
    }

    public function r2Disk(?array $config = null)
    {
        $config ??= $this->r2();

        return Storage::build([
            'driver' => 's3',
            'key' => $config['access_key_id'],
            'secret' => $config['secret_access_key'],
            'region' => $config['region'],
            'bucket' => $config['bucket'],
            'endpoint' => $config['endpoint'],
            'use_path_style_endpoint' => $config['use_path_style_endpoint'],
            'throw' => true,
            'report' => true,
        ]);
    }

    public function midtransSummary(): array
    {
        $config = $this->midtrans();

        return [
            'gateway' => 'midtrans',
            'environment' => $config['production'] ? 'production' : 'sandbox',
            'merchant_id' => $config['merchant_id'],
            'client_key_masked' => $this->mask($config['client_key']),
            'client_key_configured' => filled($config['client_key']),
            'server_key_masked' => $this->mask($config['server_key']),
            'server_key_configured' => filled($config['server_key']),
            'qris_enabled' => $config['qris_enabled'],
            'notification_url' => url('/api/v1/payments/midtrans/notification'),
            'source' => $config['source'],
            'updated_at' => $config['updated_at'],
        ];
    }

    public function r2Summary(): array
    {
        $config = $this->r2();

        return [
            'provider' => 'cloudflare_r2',
            'enabled' => $config['enabled'],
            'bucket' => $config['bucket'],
            'endpoint' => $config['endpoint'],
            'region' => $config['region'],
            'use_path_style_endpoint' => $config['use_path_style_endpoint'],
            'access_key_id_masked' => $this->mask($config['access_key_id']),
            'access_key_id_configured' => filled($config['access_key_id']),
            'secret_access_key_configured' => filled($config['secret_access_key']),
            'source' => $config['source'],
            'updated_at' => $config['updated_at'],
        ];
    }

    private function stored(string $key): array
    {
        if (! Schema::hasTable('platform_settings')) {
            return [];
        }

        return PlatformSetting::query()->where('key', $key)->first()?->encrypted_value ?? [];
    }

    private function updatedAt(string $key): ?string
    {
        if (! Schema::hasTable('platform_settings')) {
            return null;
        }

        return PlatformSetting::query()->where('key', $key)->first()?->updated_at?->toISOString();
    }

    private function save(string $key, array $payload, User $user): void
    {
        PlatformSetting::query()->updateOrCreate(
            ['key' => $key],
            ['encrypted_value' => $payload, 'updated_by' => $user->id]
        );
    }

    private function requireSecrets(array $payload, array $keys): void
    {
        $errors = [];
        foreach ($keys as $key) {
            if (blank($payload[$key] ?? null)) {
                $errors[$key] = "The {$key} field is required before testing or enabling this integration.";
            }
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function mask(?string $value): ?string
    {
        if (blank($value)) {
            return null;
        }

        if (strlen($value) <= 8) {
            return str_repeat('*', strlen($value));
        }

        return substr($value, 0, 4).str_repeat('*', max(4, strlen($value) - 8)).substr($value, -4);
    }
}
