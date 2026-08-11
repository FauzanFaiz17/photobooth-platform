<?php

namespace Tests\Feature;

use App\Models\Partner;
use App\Models\PartnerSubscription;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

abstract class ApiTestCase extends TestCase
{
    use RefreshDatabase;

    protected Role $superAdminRole;

    protected Role $managerRole;

    protected Role $operatorRole;

    protected User $superAdmin;

    protected SubscriptionPlan $trialPlan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdminRole = Role::create([
            'name' => 'Super Admin',
            'slug' => 'super-admin',
            'level' => 100,
            'is_system' => true,
        ]);

        $this->managerRole = Role::create([
            'name' => 'Partner Manager',
            'slug' => 'partner-manager',
            'level' => 50,
            'is_system' => true,
        ]);

        $this->operatorRole = Role::create([
            'name' => 'Operator',
            'slug' => 'operator',
            'level' => 10,
            'is_system' => true,
        ]);

        $permissionSlugs = [
            'users.view', 'users.create', 'users.update', 'users.delete',
            'partners.view', 'partners.create', 'partners.update', 'partners.delete',
            'subscriptions.view', 'subscriptions.create',
            'subscriptions.update', 'subscriptions.delete',
            'booths.view', 'booths.create', 'booths.update', 'booths.delete',
            'devices.view', 'devices.create', 'devices.update', 'devices.delete',
            'templates.view', 'templates.create', 'templates.update', 'templates.delete',
            'filters.view', 'filters.create', 'filters.update', 'filters.delete',
            'camera_profiles.view', 'camera_profiles.create',
            'camera_profiles.update', 'camera_profiles.delete',
            'printer_profiles.view', 'printer_profiles.create',
            'printer_profiles.update', 'printer_profiles.delete',
            'events.view', 'events.create', 'events.update', 'events.delete',
            'customers.view', 'customers.create', 'customers.update', 'customers.delete',
            'vouchers.view', 'vouchers.create', 'vouchers.update', 'vouchers.delete',
            'payments.view', 'payments.create', 'payments.update', 'payments.delete',
        ];

        foreach ($permissionSlugs as $slug) {
            [$module, $action] = explode('.', $slug);
            $permission = Permission::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => ucfirst($action).' '.ucfirst($module),
                    'module' => $module,
                ]
            );
            $this->superAdminRole->permissions()->attach($permission);
        }

        $this->superAdmin = User::create([
            'role_id' => $this->superAdminRole->id,
            'name' => 'API Super Admin',
            'email' => 'admin@example.test',
            'password' => 'Password123!',
            'status' => 'active',
        ]);

        $this->trialPlan = SubscriptionPlan::create([
            'name' => 'Trial',
            'price' => 0,
            'billing_cycle' => 'monthly',
            'max_booths' => 10,
            'max_devices' => 10,
            'max_operators' => 10,
            'features' => ['testing'],
            'is_active' => true,
        ]);
    }

    protected function authenticateAsSuperAdmin(): void
    {
        Sanctum::actingAs($this->superAdmin);
    }

    protected function createPartner(array $attributes = []): Partner
    {
        $sequence = Partner::withTrashed()->count() + 1;

        return Partner::create(array_merge([
            'company_name' => "Partner {$sequence}",
            'brand_name' => "Brand {$sequence}",
            'slug' => "partner-{$sequence}",
            'email' => "partner{$sequence}@example.test",
            'status' => 'active',
        ], $attributes));
    }

    protected function activateSubscription(Partner $partner): void
    {
        PartnerSubscription::create([
            'partner_id' => $partner->id,
            'subscription_plan_id' => $this->trialPlan->id,
            'status' => 'active',
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
            'auto_renew' => false,
        ]);
    }

    protected function createOperator(Partner $partner, array $attributes = []): User
    {
        $sequence = User::withTrashed()->count() + 1;

        return User::create(array_merge([
            'partner_id' => $partner->id,
            'role_id' => $this->operatorRole->id,
            'name' => "Operator {$sequence}",
            'email' => "operator{$sequence}@example.test",
            'password' => 'Password123!',
            'status' => 'active',
        ], $attributes));
    }
}
