<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

class RoleAccessApiTest extends ApiTestCase
{
    public function test_role_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/roles')
            ->assertUnauthorized()
            ->assertJsonPath('success', false);

        $this->getJson('/api/v1/permissions')
            ->assertUnauthorized()
            ->assertJsonPath('success', false);

        $this->putJson("/api/v1/roles/{$this->operatorRole->id}/permissions", [
            'permission_ids' => [],
        ])->assertUnauthorized()->assertJsonPath('success', false);
    }

    public function test_operator_without_permission_cannot_view_roles(): void
    {
        $partner = $this->createPartner();
        $operator = $this->createOperator($partner);

        Sanctum::actingAs($operator);

        $this->getJson('/api/v1/roles')
            ->assertForbidden()
            ->assertJsonPath('success', false);

        $this->getJson('/api/v1/permissions')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_super_admin_lists_roles_with_granted_permissions(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->getJson('/api/v1/roles')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.slug', 'super-admin');

        $response = $this->getJson('/api/v1/roles/'.$this->operatorRole->id)
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.slug', 'operator');

        $this->assertSame([], $response->json('data.permission_ids'));
    }

    public function test_super_admin_lists_permissions_grouped_by_module(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/v1/permissions')
            ->assertOk()
            ->assertJsonPath('success', true);

        $modules = collect($response->json('data'))->pluck('module');

        $this->assertContains('roles', $modules);
        $this->assertContains('events', $modules);

        $rolesGroup = collect($response->json('data'))->firstWhere('module', 'roles');
        $this->assertContains('roles.update', collect($rolesGroup['permissions'])->pluck('slug'));
    }

    public function test_super_admin_can_grant_and_revoke_role_permissions(): void
    {
        $this->authenticateAsSuperAdmin();

        $eventsView = Permission::where('slug', 'events.view')->firstOrFail();
        $eventsDelete = Permission::where('slug', 'events.delete')->firstOrFail();

        $this->putJson("/api/v1/roles/{$this->operatorRole->id}/permissions", [
            'permission_ids' => [$eventsView->id],
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.slug', 'operator')
            ->assertJsonPath('data.permission_ids', [$eventsView->id]);

        $this->assertTrue(
            $this->operatorRole->permissions()->where('permission_id', $eventsView->id)->exists()
        );

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'update',
            'subject_type' => Role::class,
            'subject_id' => $this->operatorRole->id,
            'description' => 'Role permissions updated.',
        ]);

        $this->putJson("/api/v1/roles/{$this->operatorRole->id}/permissions", [
            'permission_ids' => [$eventsView->id, $eventsDelete->id],
        ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $revoke = $this->putJson("/api/v1/roles/{$this->operatorRole->id}/permissions", [
            'permission_ids' => [$eventsDelete->id],
        ])
            ->assertOk();

        $this->assertSame([$eventsDelete->id], $revoke->json('data.permission_ids'));

        $this->assertFalse(
            $this->operatorRole->permissions()->where('permission_id', $eventsView->id)->exists()
        );
    }

    public function test_super_admin_role_permissions_cannot_be_modified(): void
    {
        $this->authenticateAsSuperAdmin();

        $before = $this->superAdminRole->permissions()->count();

        $this->putJson("/api/v1/roles/{$this->superAdminRole->id}/permissions", [
            'permission_ids' => [],
        ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertSame($before, $this->superAdminRole->permissions()->count());
    }

    public function test_non_super_admin_cannot_sync_role_permissions(): void
    {
        $updatePermission = Permission::where('slug', 'roles.update')->firstOrFail();
        $this->managerRole->permissions()->attach($updatePermission);

        $partner = $this->createPartner();
        $manager = User::create([
            'partner_id' => $partner->id,
            'role_id' => $this->managerRole->id,
            'name' => 'Manager Roles',
            'email' => 'manager-roles@example.test',
            'password' => 'Password123!',
            'status' => 'active',
        ]);

        Sanctum::actingAs($manager);

        $this->putJson("/api/v1/roles/{$this->operatorRole->id}/permissions", [
            'permission_ids' => [],
        ])->assertForbidden()->assertJsonPath('success', false);

        $this->assertSame(0, $this->operatorRole->permissions()->count());
    }

    public function test_sync_rejects_unknown_permission_ids(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->putJson("/api/v1/roles/{$this->operatorRole->id}/permissions", [
            'permission_ids' => [999999],
        ])->assertUnprocessable()->assertJsonPath('success', false);

        $this->assertSame(0, $this->operatorRole->permissions()->count());
    }

    public function test_profile_returns_permission_slugs_for_frontend_gating(): void
    {
        $this->authenticateAsSuperAdmin();

        $permissions = $this->getJson('/api/v1/profile')
            ->assertOk()
            ->json('data.permissions');

        $this->assertContains('users.view', $permissions);
        $this->assertContains('roles.update', $permissions);

        $this->postJson('/api/v1/login', [
            'email' => $this->superAdmin->email,
            'password' => 'Password123!',
        ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $loginPermissions = $this->postJson('/api/v1/login', [
            'email' => $this->superAdmin->email,
            'password' => 'Password123!',
        ])->json('data.user.permissions');

        $this->assertContains('roles.update', $loginPermissions);
    }
}
