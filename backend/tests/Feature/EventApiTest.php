<?php

namespace Tests\Feature;

use App\Models\Booth;
use App\Models\CameraProfile;
use App\Models\Device;
use App\Models\Event;
use App\Models\Filter;
use App\Models\Partner;
use App\Models\Permission;
use App\Models\PrinterProfile;
use App\Models\Template;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

class EventApiTest extends ApiTestCase
{
    public function test_event_crud_snapshots_and_desktop_configuration_succeed(): void
    {
        $partner = $this->createPartner();
        $this->activateSubscription($partner);
        $booth = $this->createEventBooth($partner->id);
        [$template, $filter, $camera, $printer] = $this->configurations();

        $this->authenticateAsSuperAdmin();

        $created = $this->postJson('/api/v1/events', [
            'booth_id' => $booth->id,
            'event_name' => 'Wedding Event',
            'template_id' => $template->id,
            'filter_id' => $filter->id,
            'camera_profile_id' => $camera->id,
            'printer_profile_id' => $printer->id,
            'event_date' => now()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '18:00',
            'price' => 50000,
            'print_count_limit' => 2,
            'status' => 'scheduled',
        ])->assertCreated()
            ->assertJsonPath('data.partner.id', $partner->id)
            ->assertJsonPath(
                'data.configuration.template.name',
                'Snapshot Template'
            );

        $eventId = $created->json('data.id');
        $eventCode = $created->json('data.event_code');
        $event = Event::findOrFail($eventId);
        $snapshotId = $event->template_snapshot_id;

        $this->getJson('/api/v1/events?per_page=5')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->getJson("/api/v1/events/{$eventId}")
            ->assertOk()
            ->assertJsonPath('data.event_code', $eventCode);

        $this->putJson("/api/v1/events/{$eventId}", [
            'event_name' => 'Wedding Event Updated',
            'event_date' => now()->toDateString(),
            'start_time' => '11:00',
            'end_time' => '19:00',
            'price' => 75000,
            'print_count_limit' => 3,
            'status' => 'ongoing',
        ])->assertOk()
            ->assertJsonPath('data.status', 'ongoing');

        $this->putJson("/api/v1/templates/{$template->id}", [
            'name' => 'Master Template Updated',
            'preview_path' => null,
            'thumbnail_path' => null,
            'json_layout' => ['frames' => [['x' => 100]]],
            'psd_path' => null,
            'png_path' => 'templates/updated.png',
            'status' => 'published',
        ])->assertOk()
            ->assertJsonPath('data.version', 2);

        $this->getJson("/api/v1/events/{$eventId}")
            ->assertOk()
            ->assertJsonPath(
                'data.configuration.template.name',
                'Snapshot Template'
            )
            ->assertJsonPath(
                'data.configuration.template.json_layout.frames.0.x',
                0
            );

        $this->assertSame(
            $snapshotId,
            Event::findOrFail($eventId)->template_snapshot_id
        );

        [$operator, $device] = $this->desktopContext($partner->id, $booth->id);
        Sanctum::actingAs($operator);

        $this->withHeader('X-Device-UUID', $device->device_uuid)
            ->getJson("/api/v1/desktop/events/{$eventCode}/configuration")
            ->assertOk()
            ->assertJsonPath('data.event.id', $eventId)
            ->assertJsonPath('data.template.name', 'Snapshot Template')
            ->assertJsonPath('data.camera.burst_count', 4);

        Sanctum::actingAs($this->superAdmin);

        $this->deleteJson("/api/v1/events/{$eventId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted(Event::class, ['id' => $eventId]);
        $this->assertDatabaseHas('template_snapshots', ['id' => $snapshotId]);
    }

    public function test_partner_cannot_create_event_for_another_tenant_booth(): void
    {
        $partnerA = $this->createPartner();
        $partnerB = $this->createPartner();
        $this->activateSubscription($partnerA);
        $this->activateSubscription($partnerB);
        $boothB = $this->createEventBooth($partnerB->id);
        [$template, $filter, $camera, $printer] = $this->configurations();
        $manager = $this->createEventManager($partnerA->id);
        Sanctum::actingAs($manager);

        $this->postJson('/api/v1/events', [
            'booth_id' => $boothB->id,
            'event_name' => 'Cross Tenant',
            'template_id' => $template->id,
            'filter_id' => $filter->id,
            'camera_profile_id' => $camera->id,
            'printer_profile_id' => $printer->id,
            'event_date' => now()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
        ])->assertForbidden();
    }

    public function test_desktop_cannot_load_event_from_another_booth(): void
    {
        $partner = $this->createPartner();
        $this->activateSubscription($partner);
        $eventBooth = $this->createEventBooth($partner->id, 'Event Booth');
        $otherBooth = $this->createEventBooth($partner->id, 'Other Booth');
        [$template, $filter, $camera, $printer] = $this->configurations();
        $this->authenticateAsSuperAdmin();

        $eventCode = $this->postJson('/api/v1/events', [
            'booth_id' => $eventBooth->id,
            'event_name' => 'Restricted Event',
            'template_id' => $template->id,
            'filter_id' => $filter->id,
            'camera_profile_id' => $camera->id,
            'printer_profile_id' => $printer->id,
            'event_date' => now()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'scheduled',
        ])->json('data.event_code');

        [$operator, $device] = $this->desktopContext(
            $partner->id,
            $otherBooth->id,
            '55555555-5555-4555-8555-555555555555'
        );
        Sanctum::actingAs($operator);

        $this->withHeader('X-Device-UUID', $device->device_uuid)
            ->getJson("/api/v1/desktop/events/{$eventCode}/configuration")
            ->assertNotFound();
    }

    private function configurations(): array
    {
        return [
            Template::create([
                'partner_id' => null,
                'name' => 'Snapshot Template',
                'json_layout' => ['frames' => [['x' => 0, 'y' => 0]]],
                'png_path' => 'templates/snapshot.png',
                'version' => 1,
                'status' => 'published',
            ]),
            Filter::create([
                'partner_id' => null,
                'name' => 'Snapshot Filter',
                'brightness' => 0,
                'contrast' => 0,
                'saturation' => 0,
                'sharpness' => 0,
                'white_balance' => 0,
                'intensity' => 100,
                'version' => 1,
                'is_active' => true,
            ]),
            CameraProfile::create([
                'partner_id' => null,
                'name' => 'Snapshot Camera',
                'iso' => '400',
                'countdown_seconds' => 3,
                'burst_count' => 4,
                'live_view' => true,
                'version' => 1,
                'is_active' => true,
            ]),
            PrinterProfile::create([
                'partner_id' => null,
                'printer_name' => 'Snapshot Printer',
                'copies' => 1,
                'paper_size' => '4x6',
                'orientation' => 'portrait',
                'auto_print' => true,
                'border' => false,
                'bleed' => 0,
                'delay_ms' => 0,
                'version' => 1,
                'is_active' => true,
            ]),
        ];
    }

    private function createEventBooth(
        int $partnerId,
        string $name = 'Event Booth'
    ): Booth {
        return Booth::create([
            'partner_id' => $partnerId,
            'name' => $name,
            'location' => 'Testing',
            'status' => 'active',
        ]);
    }

    private function desktopContext(
        int $partnerId,
        int $boothId,
        string $uuid = '66666666-6666-4666-8666-666666666666'
    ): array {
        $partner = Partner::findOrFail($partnerId);
        $operator = $this->createOperator($partner, [
            'email' => "event-operator-{$boothId}@example.test",
        ]);
        $device = Device::create([
            'partner_id' => $partnerId,
            'booth_id' => $boothId,
            'device_key' => "event-device-{$boothId}",
            'device_uuid' => $uuid,
            'device_name' => 'Event Device',
            'status' => 'active',
        ]);

        return [$operator, $device];
    }

    private function createEventManager(int $partnerId): User
    {
        $permissions = Permission::whereIn('slug', [
            'events.view',
            'events.create',
            'events.update',
            'events.delete',
        ])->pluck('id');
        $this->managerRole->permissions()->syncWithoutDetaching($permissions);

        return User::create([
            'partner_id' => $partnerId,
            'role_id' => $this->managerRole->id,
            'name' => 'Event Manager',
            'email' => 'event-manager@example.test',
            'password' => 'Password123!',
            'status' => 'active',
        ]);
    }
}
