<?php

namespace Tests\Feature;

use App\Models\CameraProfile;
use App\Models\Filter;
use App\Models\Partner;
use App\Models\Permission;
use App\Models\PrinterProfile;
use App\Models\Template;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

class MasterConfigurationApiTest extends ApiTestCase
{
    public function test_all_master_configuration_crud_routes_succeed(): void
    {
        $this->authenticateAsSuperAdmin();

        $cases = [
            [
                'path' => 'templates',
                'model' => Template::class,
                'label' => 'name',
                'payload' => $this->templatePayload('Global Template'),
            ],
            [
                'path' => 'filters',
                'model' => Filter::class,
                'label' => 'name',
                'payload' => $this->filterPayload('Global Filter'),
            ],
            [
                'path' => 'camera-profiles',
                'model' => CameraProfile::class,
                'label' => 'name',
                'payload' => $this->cameraPayload('Global Camera'),
            ],
            [
                'path' => 'printer-profiles',
                'model' => PrinterProfile::class,
                'label' => 'printer_name',
                'payload' => $this->printerPayload('Global Printer'),
            ],
        ];

        foreach ($cases as $case) {
            $created = $this->postJson(
                "/api/v1/{$case['path']}",
                $case['payload']
            )->assertCreated()
                ->assertJsonPath('data.version', 1)
                ->assertJsonPath('data.is_global', true);

            $id = $created->json('data.id');

            $this->getJson("/api/v1/{$case['path']}?per_page=5")
                ->assertOk()
                ->assertJsonPath('meta.total', 1);

            $this->getJson("/api/v1/{$case['path']}/{$id}")
                ->assertOk()
                ->assertJsonPath('data.id', $id);

            $updatedPayload = $case['payload'];
            $updatedPayload[$case['label']] .= ' Updated';

            $this->putJson(
                "/api/v1/{$case['path']}/{$id}",
                $updatedPayload
            )->assertOk()
                ->assertJsonPath('data.version', 2)
                ->assertJsonPath(
                    "data.{$case['label']}",
                    $updatedPayload[$case['label']]
                );

            $this->deleteJson("/api/v1/{$case['path']}/{$id}")
                ->assertOk()
                ->assertJsonPath('success', true);

            $this->assertSoftDeleted($case['model'], ['id' => $id]);
        }
    }

    public function test_partner_can_only_manage_own_configuration_and_view_global_assets(): void
    {
        $partnerA = $this->createPartner();
        $partnerB = $this->createPartner();
        $manager = $this->createManagerWithPermissions($partnerA, [
            'templates.view',
            'templates.create',
            'templates.update',
            'templates.delete',
        ]);

        $global = Template::create([
            ...$this->templatePayload('Global'),
            'partner_id' => null,
            'version' => 1,
        ]);
        $own = Template::create([
            ...$this->templatePayload('Own'),
            'partner_id' => $partnerA->id,
            'version' => 1,
        ]);
        $other = Template::create([
            ...$this->templatePayload('Other'),
            'partner_id' => $partnerB->id,
            'version' => 1,
        ]);

        Sanctum::actingAs($manager);

        $this->getJson('/api/v1/templates?per_page=5')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonFragment(['id' => $global->id])
            ->assertJsonFragment(['id' => $own->id])
            ->assertJsonMissing(['id' => $other->id]);

        $this->getJson("/api/v1/templates/{$other->id}")
            ->assertForbidden();

        $this->putJson(
            "/api/v1/templates/{$global->id}",
            $this->templatePayload('Cannot Change Global')
        )->assertForbidden();

        $created = $this->postJson('/api/v1/templates', [
            ...$this->templatePayload('Forced Tenant'),
            'partner_id' => $partnerB->id,
        ])->assertCreated();

        $this->assertSame(
            $partnerA->id,
            $created->json('data.partner.id')
        );
    }

    private function createManagerWithPermissions(
        Partner $partner,
        array $permissionSlugs
    ): User {
        $permissions = Permission::whereIn(
            'slug',
            $permissionSlugs
        )->pluck('id');
        $this->managerRole->permissions()->syncWithoutDetaching($permissions);

        return User::create([
            'partner_id' => $partner->id,
            'role_id' => $this->managerRole->id,
            'name' => 'Configuration Manager',
            'email' => 'configuration-manager@example.test',
            'password' => 'Password123!',
            'status' => 'active',
        ]);
    }

    private function templatePayload(string $name): array
    {
        return [
            'name' => $name,
            'preview_path' => null,
            'thumbnail_path' => null,
            'json_layout' => ['frames' => [['x' => 0, 'y' => 0]]],
            'psd_path' => null,
            'png_path' => 'templates/example.png',
            'status' => 'published',
        ];
    }

    private function filterPayload(string $name): array
    {
        return [
            'name' => $name,
            'lut_path' => null,
            'brightness' => 0,
            'contrast' => 5,
            'saturation' => 10,
            'sharpness' => 0,
            'white_balance' => 0,
            'intensity' => 100,
            'is_active' => true,
        ];
    }

    private function cameraPayload(string $name): array
    {
        return [
            'name' => $name,
            'iso' => '400',
            'shutter_speed' => '1/125',
            'aperture' => 'f/5.6',
            'white_balance' => 'Auto',
            'exposure' => '0',
            'focus_mode' => 'AF',
            'countdown_seconds' => 3,
            'burst_count' => 4,
            'image_quality' => 'JPEG',
            'live_view' => true,
            'is_active' => true,
        ];
    }

    private function printerPayload(string $name): array
    {
        return [
            'printer_name' => $name,
            'copies' => 1,
            'paper_size' => '4x6',
            'orientation' => 'portrait',
            'auto_print' => true,
            'border' => false,
            'bleed' => 0,
            'delay_ms' => 0,
            'is_active' => true,
        ];
    }
}
