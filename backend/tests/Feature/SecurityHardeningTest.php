<?php

namespace Tests\Feature;

use App\Contracts\MediaStorage;
use App\Models\Booth;
use App\Models\Device;
use App\Models\PhotoSession;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;

class SecurityHardeningTest extends ApiTestCase
{
    protected function tearDown(): void
    {
        $this->clearLoginLimit();
        parent::tearDown();
    }

    public function test_login_is_rate_limited_and_relogin_revokes_same_client_token(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/v1/login', ['email' => $this->superAdmin->email, 'password' => 'wrong'])->assertUnauthorized();
        }
        $this->postJson('/api/v1/login', ['email' => $this->superAdmin->email, 'password' => 'wrong'])->assertTooManyRequests();

        $this->clearLoginLimit();
        config()->set('sanctum.expiration', 60);
        $first = $this->postJson('/api/v1/login', ['email' => $this->superAdmin->email, 'password' => 'Password123!'])->assertOk()->json('data.token');
        $second = $this->postJson('/api/v1/login', ['email' => $this->superAdmin->email, 'password' => 'Password123!'])->assertOk()->json('data.token');

        $this->assertNotSame($first, $second);
        $this->assertDatabaseCount('personal_access_tokens', 1);
        $this->assertNotNull(PersonalAccessToken::first()->expires_at);
        app('auth')->forgetGuards();
        $this->withToken($first)->getJson('/api/v1/profile')->assertUnauthorized();
        app('auth')->forgetGuards();
        $this->withToken($second)->getJson('/api/v1/profile')->assertOk();

        PersonalAccessToken::firstOrFail()->update(['expires_at' => now()->subMinute()]);
        app('auth')->forgetGuards();
        $this->withToken($second)->getJson('/api/v1/profile')->assertUnauthorized();
    }

    public function test_device_activation_is_rate_limited_without_exposing_codes(): void
    {
        $payload = [
            'activation_code' => 'PB-INVALID-CODE',
            'device_uuid' => (string) Str::uuid(),
        ];

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/v1/desktop/devices/activate', $payload)->assertUnprocessable();
        }

        $this->postJson('/api/v1/desktop/devices/activate', $payload)
            ->assertTooManyRequests()
            ->assertDontSee('PB-INVALID-CODE');
    }

    public function test_storage_failure_does_not_create_media_record(): void
    {
        [$operator, $device, $session] = $this->desktopSession();
        $storage = \Mockery::mock(MediaStorage::class);
        $storage->shouldReceive('put')->once()->andReturnFalse();
        $this->app->instance(MediaStorage::class, $storage);
        Sanctum::actingAs($operator);

        $this->withHeader('X-Device-UUID', $device->device_uuid)
            ->postJson("/api/v1/desktop/photo-sessions/{$session->id}/media", [
                'type' => 'template', 'filename' => 'failed.png', 'mime_type' => 'image/png',
                'data_url' => 'data:image/png;base64,'.base64_encode('failed'),
            ])->assertUnprocessable();
        $this->assertDatabaseCount('media', 0);
    }

    private function desktopSession(): array
    {
        $partner = $this->createPartner();
        $booth = Booth::create(['partner_id' => $partner->id, 'name' => 'Secure Booth', 'status' => 'active']);
        $operator = $this->createOperator($partner);
        $device = Device::create(['partner_id' => $partner->id, 'booth_id' => $booth->id, 'device_key' => 'secure-device', 'device_uuid' => 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'device_name' => 'Secure Device', 'status' => 'active']);
        $session = PhotoSession::create(['partner_id' => $partner->id, 'booth_id' => $booth->id, 'device_id' => $device->id, 'operator_id' => $operator->id, 'download_token' => str_repeat('e', 64), 'status' => 'started', 'started_at' => now()]);

        return [$operator, $device, $session];
    }

    private function clearLoginLimit(): void
    {
        RateLimiter::clear(md5('login'.'127.0.0.1|'.strtolower($this->superAdmin->email)));
    }
}
