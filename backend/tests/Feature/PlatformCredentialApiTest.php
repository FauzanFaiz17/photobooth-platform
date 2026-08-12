<?php

namespace Tests\Feature;

use App\Models\Booth;
use App\Models\Device;
use App\Models\PlatformSetting;
use App\Services\PlatformCredentialService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

class PlatformCredentialApiTest extends ApiTestCase
{
    public function test_only_super_admin_can_manage_platform_credentials(): void
    {
        $partner = $this->createPartner();
        $operator = $this->createOperator($partner);
        Sanctum::actingAs($operator);

        foreach (['midtrans', 'r2'] as $provider) {
            $this->getJson("/api/v1/platform-settings/{$provider}")->assertForbidden();
            $this->postJson("/api/v1/platform-settings/{$provider}/test")->assertForbidden();
        }
    }

    public function test_midtrans_credentials_are_encrypted_masked_and_support_partial_rotation(): void
    {
        $this->authenticateAsSuperAdmin();
        $serverKey = 'SB-Mid-server-secret-2026';
        $clientKey = 'SB-Mid-client-public-2026';

        $this->putJson('/api/v1/platform-settings/midtrans', [
            'merchant_id' => 'G812345678',
            'client_key' => $clientKey,
            'server_key' => $serverKey,
            'production' => false,
            'qris_enabled' => true,
        ])->assertOk()
            ->assertJsonPath('data.environment', 'sandbox')
            ->assertJsonPath('data.server_key_configured', true)
            ->assertJsonMissing(['server_key' => $serverKey])
            ->assertJsonMissing(['client_key' => $clientKey]);

        $raw = DB::table('platform_settings')->where('key', PlatformCredentialService::MIDTRANS_KEY)
            ->value('encrypted_value');
        $this->assertStringNotContainsString($serverKey, $raw);
        $this->assertStringNotContainsString($clientKey, $raw);

        $this->putJson('/api/v1/platform-settings/midtrans', [
            'merchant_id' => 'G812345678',
            'production' => true,
            'qris_enabled' => true,
        ])->assertOk()->assertJsonPath('data.environment', 'production');

        $stored = PlatformSetting::where('key', PlatformCredentialService::MIDTRANS_KEY)->firstOrFail();
        $this->assertSame($serverKey, $stored->encrypted_value['server_key']);
        $this->assertSame($clientKey, $stored->encrypted_value['client_key']);
        $this->assertDatabaseHas('audit_logs', ['description' => 'Midtrans credential configuration updated.']);

        config()->set('services.midtrans.server_key', null);
        config()->set('services.midtrans.client_key', null);
        $this->deleteJson('/api/v1/platform-settings/midtrans')
            ->assertOk()
            ->assertJsonPath('data.source', 'environment')
            ->assertJsonPath('data.server_key_configured', false);
        $this->assertDatabaseMissing('platform_settings', ['key' => PlatformCredentialService::MIDTRANS_KEY]);
    }

    public function test_midtrans_connection_and_payment_use_database_credentials(): void
    {
        $this->authenticateAsSuperAdmin();
        $serverKey = 'database-midtrans-server-key';
        $this->putJson('/api/v1/platform-settings/midtrans', [
            'merchant_id' => 'G812345678',
            'client_key' => 'database-midtrans-client-key',
            'server_key' => $serverKey,
            'production' => false,
            'qris_enabled' => true,
        ])->assertOk();

        Http::fake([
            'https://api.sandbox.midtrans.com/v2/photobooth-credential-check/status' => Http::response([], 404),
            'https://api.sandbox.midtrans.com/v2/charge' => Http::response([
                'transaction_id' => 'database-credential-transaction',
                'transaction_status' => 'pending',
            ], 201),
        ]);

        $this->postJson('/api/v1/platform-settings/midtrans/test')
            ->assertOk()
            ->assertJsonPath('data.connected', true)
            ->assertJsonPath('data.http_status', 404);

        [$operator, $device] = $this->desktopContext();
        Sanctum::actingAs($operator);
        $this->withHeader('X-Device-UUID', $device->device_uuid)
            ->postJson('/api/v1/desktop/payments', [
                'amount' => 35000,
                'gateway' => 'midtrans_qris',
                'idempotency_key' => 'database-credential-payment',
            ])->assertCreated()
            ->assertJsonPath('data.gateway_response.transaction_id', 'database-credential-transaction');

        Http::assertSent(fn (Request $request) => $request->url() === 'https://api.sandbox.midtrans.com/v2/charge'
            && $request->hasHeader('Authorization', 'Basic '.base64_encode($serverKey.':')));
    }

    public function test_r2_credentials_are_encrypted_masked_and_connection_can_be_tested(): void
    {
        $this->authenticateAsSuperAdmin();
        $accessKey = 'r2-access-key-2026';
        $secretKey = 'r2-secret-key-2026';

        $this->putJson('/api/v1/platform-settings/r2', [
            'access_key_id' => $accessKey,
            'secret_access_key' => $secretKey,
            'bucket' => 'photobooth-test',
            'endpoint' => 'https://account-id.r2.cloudflarestorage.com',
            'region' => 'auto',
            'use_path_style_endpoint' => true,
            'enabled' => false,
        ])->assertOk()
            ->assertJsonPath('data.bucket', 'photobooth-test')
            ->assertJsonPath('data.access_key_id_configured', true)
            ->assertJsonPath('data.secret_access_key_configured', true)
            ->assertJsonMissing(['access_key_id' => $accessKey])
            ->assertJsonMissing(['secret_access_key' => $secretKey]);

        $raw = DB::table('platform_settings')->where('key', PlatformCredentialService::R2_KEY)
            ->value('encrypted_value');
        $this->assertStringNotContainsString($accessKey, $raw);
        $this->assertStringNotContainsString($secretKey, $raw);

        Storage::fake('r2');
        $mock = \Mockery::mock(PlatformCredentialService::class)->makePartial();
        $mock->shouldReceive('r2Disk')->once()->andReturn(Storage::disk('r2'));
        $this->app->instance(PlatformCredentialService::class, $mock);

        $this->postJson('/api/v1/platform-settings/r2/test')
            ->assertOk()
            ->assertJsonPath('data.connected', true)
            ->assertJsonPath('data.health_check_object_exists', false);
    }

    private function desktopContext(): array
    {
        $partner = $this->createPartner(['slug' => 'credential-payment']);
        $booth = Booth::create(['partner_id' => $partner->id, 'name' => 'Credential Booth', 'status' => 'active']);
        $operator = $this->createOperator($partner, ['email' => 'credential-operator@example.test']);
        $device = Device::create([
            'partner_id' => $partner->id,
            'booth_id' => $booth->id,
            'device_key' => 'credential-device',
            'device_uuid' => 'abababab-abab-4bab-8bab-abababababab',
            'device_name' => 'Credential Device',
            'status' => 'active',
        ]);

        return [$operator, $device];
    }
}
