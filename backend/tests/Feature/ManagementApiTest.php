<?php

namespace Tests\Feature;

use App\Models\Booth;
use App\Models\Partner;
use App\Models\Permission;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

class ManagementApiTest extends ApiTestCase
{
    public function test_all_user_routes_succeed(): void
    {
        $partner = $this->createPartner();
        $this->authenticateAsSuperAdmin();

        $created = $this->postJson('/api/v1/users', [
            'name' => 'Created Operator',
            'email' => 'created@example.test',
            'phone' => '08123456789',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role_id' => $this->operatorRole->id,
            'partner_id' => $partner->id,
            'status' => 'active',
        ])->assertCreated()
            ->assertJsonPath('data.email', 'created@example.test');

        $userId = $created->json('data.id');

        $this->getJson('/api/v1/users?search=Created&per_page=5')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->getJson("/api/v1/users/{$userId}")
            ->assertOk()
            ->assertJsonPath('data.id', $userId);

        $this->putJson("/api/v1/users/{$userId}", [
            'name' => 'Updated Operator',
            'email' => 'updated@example.test',
            'phone' => null,
            'status' => 'suspended',
        ])->assertOk()
            ->assertJsonPath('data.name', 'Updated Operator')
            ->assertJsonPath('data.status', 'suspended');

        $this->deleteJson("/api/v1/users/{$userId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted(User::class, ['id' => $userId]);
    }

    public function test_all_partner_routes_succeed(): void
    {
        $this->authenticateAsSuperAdmin();

        $created = $this->postJson('/api/v1/partners', [
            'company_name' => 'Created Company',
            'brand_name' => 'Created Brand',
            'email' => 'created-partner@example.test',
            'status' => 'trial',
        ])->assertCreated()
            ->assertJsonPath('data.subscription.plan.name', 'Trial');

        $partnerId = $created->json('data.id');

        $this->getJson('/api/v1/partners?search=Created&per_page=5')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->getJson("/api/v1/partners/{$partnerId}")
            ->assertOk()
            ->assertJsonPath('data.id', $partnerId);

        $this->putJson("/api/v1/partners/{$partnerId}", [
            'company_name' => 'Updated Company',
            'brand_name' => null,
            'address' => 'Jakarta',
            'phone' => null,
            'email' => 'updated-partner@example.test',
            'tax_number' => null,
            'status' => 'active',
        ])->assertOk()
            ->assertJsonPath('data.company_name', 'Updated Company');

        $this->deleteJson("/api/v1/partners/{$partnerId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted(Partner::class, ['id' => $partnerId]);
    }

    public function test_all_subscription_plan_routes_succeed(): void
    {
        $this->authenticateAsSuperAdmin();

        $payload = [
            'name' => 'API Plan',
            'price' => 150000,
            'billing_cycle' => 'monthly',
            'max_booths' => 2,
            'max_devices' => 4,
            'max_operators' => 5,
            'features' => ['gallery', 'printing'],
            'is_active' => true,
        ];

        $created = $this->postJson('/api/v1/subscription-plans', $payload)
            ->assertCreated()
            ->assertJsonPath('data.name', 'API Plan');

        $planId = $created->json('data.id');

        $this->getJson('/api/v1/subscription-plans?search=API&per_page=5')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->getJson("/api/v1/subscription-plans/{$planId}")
            ->assertOk()
            ->assertJsonPath('data.id', $planId);

        $payload['name'] = 'Updated API Plan';
        $payload['price'] = 175000;

        $this->putJson("/api/v1/subscription-plans/{$planId}", $payload)
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated API Plan');

        $this->deleteJson("/api/v1/subscription-plans/{$planId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted(SubscriptionPlan::class, ['id' => $planId]);
    }

    public function test_all_booth_routes_succeed(): void
    {
        $partner = $this->createPartner();
        $this->activateSubscription($partner);
        $this->authenticateAsSuperAdmin();

        $created = $this->postJson('/api/v1/booths', [
            'partner_id' => $partner->id,
            'name' => 'API Booth',
            'location' => 'Jakarta',
            'status' => 'active',
        ])->assertCreated()
            ->assertJsonPath('data.name', 'API Booth');

        $boothId = $created->json('data.id');

        $this->getJson('/api/v1/booths?search=API&per_page=5')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->getJson("/api/v1/booths/{$boothId}")
            ->assertOk()
            ->assertJsonPath('data.id', $boothId);

        $this->putJson("/api/v1/booths/{$boothId}", [
            'name' => 'Updated Booth',
            'location' => 'Bandung',
            'status' => 'maintenance',
        ])->assertOk()
            ->assertJsonPath('data.status', 'maintenance');

        $this->deleteJson("/api/v1/booths/{$boothId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted(Booth::class, ['id' => $boothId]);
    }

    public function test_management_routes_require_authentication_and_permission(): void
    {
        $this->getJson('/api/v1/users')
            ->assertUnauthorized()
            ->assertJsonPath('success', false);

        $partner = $this->createPartner();
        $operator = $this->createOperator($partner);
        Sanctum::actingAs($operator);

        $this->getJson('/api/v1/users')
            ->assertForbidden()
            ->assertJsonPath('success', false);
    }

    public function test_partner_user_cannot_view_another_tenant_user(): void
    {
        $permission = Permission::where('slug', 'users.view')->firstOrFail();
        $this->managerRole->permissions()->attach($permission);

        $partnerA = $this->createPartner();
        $partnerB = $this->createPartner();
        $manager = User::create([
            'partner_id' => $partnerA->id,
            'role_id' => $this->managerRole->id,
            'name' => 'Manager A',
            'email' => 'manager-a@example.test',
            'password' => 'Password123!',
            'status' => 'active',
        ]);
        $otherUser = $this->createOperator($partnerB);

        Sanctum::actingAs($manager);

        $this->getJson("/api/v1/users/{$otherUser->id}")
            ->assertForbidden();
    }

    public function test_super_admin_must_assign_partner_to_non_super_admin_user(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->postJson('/api/v1/users', [
            'name' => 'Missing Partner',
            'email' => 'missing-partner@example.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role_id' => $this->operatorRole->id,
            'status' => 'active',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('partner_id');
    }
}
