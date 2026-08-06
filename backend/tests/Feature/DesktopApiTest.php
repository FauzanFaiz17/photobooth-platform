<?php

namespace Tests\Feature;

use App\Models\Booth;
use App\Models\Device;
use App\Models\Media;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

class DesktopApiTest extends ApiTestCase
{
    public function test_device_verify_route_handles_registered_and_inactive_devices(): void
    {
        $partner = $this->createPartner();
        $booth = $this->createBooth($partner->id);
        $active = $this->createDevice($partner->id, $booth->id);
        $blocked = $this->createDevice($partner->id, $booth->id, [
            'device_uuid' => '22222222-2222-4222-8222-222222222222',
            'device_key' => 'blocked-device',
            'status' => 'blocked',
        ]);

        $this->postJson('/api/v1/desktop/devices/verify', [
            'device_uuid' => $active->device_uuid,
        ])->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.device_uuid', $active->device_uuid)
            ->assertJsonMissingPath('data.windows_uuid');

        $this->postJson('/api/v1/desktop/devices/verify', [
            'device_uuid' => $blocked->device_uuid,
        ])->assertForbidden()
            ->assertJsonPath('message', 'Perangkat tidak aktif.');

        $this->postJson('/api/v1/desktop/devices/verify', [
            'device_uuid' => '33333333-3333-4333-8333-333333333333',
        ])->assertNotFound();
    }

    public function test_bootstrap_route_returns_the_authenticated_device_context(): void
    {
        [$operator, $device] = $this->desktopContext();
        Sanctum::actingAs($operator);

        $this->withHeader('X-Device-UUID', $device->device_uuid)
            ->getJson('/api/v1/desktop/bootstrap')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.id', $operator->id)
            ->assertJsonPath('data.device.id', $device->id)
            ->assertJsonPath('data.booth.id', $device->booth_id)
            ->assertJsonStructure([
                'data' => ['user', 'device', 'partner', 'booth', 'application', 'server'],
            ]);
    }

    public function test_photo_session_create_upload_and_complete_routes_succeed(): void
    {
        Storage::fake('local');
        [$operator, $device] = $this->desktopContext();
        Sanctum::actingAs($operator);

        $headers = ['X-Device-UUID' => $device->device_uuid];

        $created = $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/photo-sessions')
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'started')
            ->assertJsonPath('data.device_id', $device->id);

        $sessionId = $created->json('data.id');
        $binary = 'image-bytes';

        $media = $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/media", [
                'type' => 'original',
                'filename' => 'raw-01.png',
                'mime_type' => 'image/png',
                'data_url' => 'data:image/png;base64,'.base64_encode($binary),
                'width' => 640,
                'height' => 480,
            ])->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.photo_session_id', $sessionId)
            ->assertJsonPath('data.size_bytes', strlen($binary));

        $storedMedia = Media::findOrFail($media->json('data.id'));
        Storage::disk('local')->assertExists($storedMedia->object_key);

        $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/complete")
            ->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonCount(1, 'data.media');

        $this->assertDatabaseHas('photo_sessions', [
            'id' => $sessionId,
            'status' => 'completed',
        ]);
    }

    public function test_desktop_routes_reject_missing_header_and_cross_tenant_access(): void
    {
        [$operator] = $this->desktopContext();
        [, $otherDevice] = $this->desktopContext(
            'other',
            '44444444-4444-4444-8444-444444444444'
        );
        Sanctum::actingAs($operator);

        $this->getJson('/api/v1/desktop/bootstrap')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('device_uuid');

        $this->withHeader('X-Device-UUID', $otherDevice->device_uuid)
            ->getJson('/api/v1/desktop/bootstrap')
            ->assertForbidden();

        $this->withHeader('X-Device-UUID', $otherDevice->device_uuid)
            ->postJson('/api/v1/desktop/photo-sessions')
            ->assertForbidden();
    }

    public function test_media_upload_rejects_mime_mismatch_and_completed_sessions(): void
    {
        Storage::fake('local');
        [$operator, $device] = $this->desktopContext();
        Sanctum::actingAs($operator);
        $headers = ['X-Device-UUID' => $device->device_uuid];

        $sessionId = $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/photo-sessions')
            ->json('data.id');

        $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/media", [
                'type' => 'original',
                'filename' => 'raw-01.png',
                'mime_type' => 'image/jpeg',
                'data_url' => 'data:image/png;base64,'.base64_encode('image'),
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('mime_type');

        $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/complete")
            ->assertOk();

        $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/media", [
                'type' => 'original',
                'filename' => 'raw-02.png',
                'mime_type' => 'image/png',
                'data_url' => 'data:image/png;base64,'.base64_encode('image'),
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('photo_session');
    }

    private function desktopContext(
        string $suffix = 'primary',
        string $uuid = '11111111-1111-4111-8111-111111111111'
    ): array {
        $partner = $this->createPartner([
            'company_name' => "Desktop {$suffix}",
            'slug' => "desktop-{$suffix}",
            'email' => "desktop-{$suffix}@example.test",
        ]);
        $booth = $this->createBooth($partner->id, "Booth {$suffix}");
        $operator = $this->createOperator($partner, [
            'email' => "operator-{$suffix}@example.test",
        ]);
        $device = $this->createDevice($partner->id, $booth->id, [
            'device_uuid' => $uuid,
            'device_key' => "device-{$suffix}",
            'device_name' => "Device {$suffix}",
        ]);

        return [$operator, $device];
    }

    private function createBooth(int $partnerId, string $name = 'Desktop Booth'): Booth
    {
        return Booth::create([
            'partner_id' => $partnerId,
            'name' => $name,
            'location' => 'Testing',
            'status' => 'active',
        ]);
    }

    private function createDevice(
        int $partnerId,
        int $boothId,
        array $attributes = []
    ): Device {
        return Device::create(array_merge([
            'partner_id' => $partnerId,
            'booth_id' => $boothId,
            'device_key' => 'active-device',
            'device_uuid' => '11111111-1111-4111-8111-111111111111',
            'device_name' => 'Active Device',
            'windows_uuid' => 'windows-test',
            'cpu_identifier' => 'cpu-test',
            'mac_address' => '00:00:00:00:00:01',
            'app_version' => '1.0.0',
            'status' => 'active',
        ], $attributes));
    }
}
