<?php

namespace Tests\Feature;

use App\Models\Booth;
use App\Models\Device;

class AuthApiTest extends ApiTestCase
{
    public function test_login_profile_and_logout_contracts(): void
    {
        $login = $this->postJson('/api/v1/login', [
            'email' => $this->superAdmin->email,
            'password' => 'Password123!',
        ]);

        $login->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.id', $this->superAdmin->id)
            ->assertJsonStructure(['data' => ['token', 'user']]);

        $token = $login->json('data.token');

        $this->withToken($token)
            ->getJson('/api/v1/profile')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', $this->superAdmin->email);

        $this->withToken($token)
            ->postJson('/api/v1/logout')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data', null);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_validation_and_invalid_credentials_are_consistent(): void
    {
        $this->postJson('/api/v1/login', [])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['email', 'password']);

        $this->postJson('/api/v1/login', [
            'email' => $this->superAdmin->email,
            'password' => 'wrong-password',
        ])->assertUnauthorized()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Password salah');
    }

    public function test_desktop_login_requires_an_operator_from_the_device_partner(): void
    {
        $devicePartner = $this->createPartner();
        $otherPartner = $this->createPartner();
        $operator = $this->createOperator($devicePartner);
        $otherOperator = $this->createOperator($otherPartner);
        $booth = Booth::create([
            'partner_id' => $devicePartner->id,
            'name' => 'Desktop Login Booth',
            'status' => 'active',
        ]);
        $device = Device::create([
            'partner_id' => $devicePartner->id,
            'booth_id' => $booth->id,
            'device_key' => 'desktop-login-device',
            'device_uuid' => '99999999-9999-4999-8999-999999999999',
            'device_name' => 'Desktop Login Device',
            'status' => 'active',
        ]);

        $this->withHeader('X-Device-UUID', $device->device_uuid)
            ->postJson('/api/v1/login', [
                'email' => $operator->email,
                'password' => 'Password123!',
            ])->assertOk()
            ->assertJsonPath('data.user.partner.id', $devicePartner->id);

        $this->assertNotNull($device->fresh()->last_login_at);
        $this->assertNotNull($device->fresh()->last_sync_at);

        $this->withHeader('X-Device-UUID', $device->device_uuid)
            ->postJson('/api/v1/login', [
                'email' => $otherOperator->email,
                'password' => 'Password123!',
            ])->assertUnauthorized()
            ->assertJsonPath('message', 'Akun operator tidak terdaftar pada partner device ini.');
    }
}
