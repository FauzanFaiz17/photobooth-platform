<?php

namespace Tests\Feature;

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
}
