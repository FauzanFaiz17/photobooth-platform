<?php

namespace Tests\Feature;

use App\Models\PartnerSubscription;
use App\Models\Permission;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

class PartnerSubscriptionApiTest extends ApiTestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_super_admin_can_create_pending_subscription_with_default_monthly_period(): void
    {
        Carbon::setTestNow('2026-08-12 09:00:00');
        $partner = $this->createPartner();
        $this->authenticateAsSuperAdmin();

        $response = $this->postJson('/api/v1/partner-subscriptions', [
            'partner_id' => $partner->id,
            'subscription_plan_id' => $this->trialPlan->id,
        ])->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.partner.id', $partner->id)
            ->assertJsonPath('data.plan.id', $this->trialPlan->id);

        $subscription = PartnerSubscription::findOrFail($response->json('data.id'));
        $this->assertTrue($subscription->starts_at->equalTo(Carbon::now()));
        $this->assertTrue($subscription->ends_at->equalTo(Carbon::now()->addMonth()));
    }

    public function test_yearly_default_period_and_inactive_plan_validation(): void
    {
        Carbon::setTestNow('2026-08-12 09:00:00');
        $partner = $this->createPartner();
        $yearlyPlan = SubscriptionPlan::create([
            'name' => 'Annual',
            'price' => 1000000,
            'billing_cycle' => 'yearly',
            'max_booths' => 5,
            'max_devices' => 5,
            'max_operators' => 5,
            'is_active' => true,
        ]);
        $inactivePlan = SubscriptionPlan::create([
            'name' => 'Retired',
            'price' => 100000,
            'billing_cycle' => 'monthly',
            'max_booths' => 1,
            'max_devices' => 1,
            'max_operators' => 1,
            'is_active' => false,
        ]);
        $this->authenticateAsSuperAdmin();

        $created = $this->postJson('/api/v1/partner-subscriptions', [
            'partner_id' => $partner->id,
            'subscription_plan_id' => $yearlyPlan->id,
        ])->assertCreated();

        $subscription = PartnerSubscription::findOrFail($created->json('data.id'));
        $this->assertTrue($subscription->ends_at->equalTo(Carbon::now()->addYear()));

        $this->postJson('/api/v1/partner-subscriptions', [
            'partner_id' => $partner->id,
            'subscription_plan_id' => $inactivePlan->id,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('subscription_plan_id');
    }

    public function test_overlapping_active_subscription_is_rejected(): void
    {
        Carbon::setTestNow('2026-08-12 09:00:00');
        $partner = $this->createPartner();
        $this->activateSubscription($partner);
        $this->authenticateAsSuperAdmin();

        $this->postJson('/api/v1/partner-subscriptions', [
            'partner_id' => $partner->id,
            'subscription_plan_id' => $this->trialPlan->id,
            'status' => 'active',
            'starts_at' => Carbon::now()->subHour()->toISOString(),
            'ends_at' => Carbon::now()->addDays(10)->toISOString(),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('period');
    }

    public function test_pending_subscription_can_only_be_activated_during_its_period(): void
    {
        Carbon::setTestNow('2026-08-12 09:00:00');
        $partner = $this->createPartner();
        $current = PartnerSubscription::create([
            'partner_id' => $partner->id,
            'subscription_plan_id' => $this->trialPlan->id,
            'status' => 'pending',
            'starts_at' => Carbon::now()->subDay(),
            'ends_at' => Carbon::now()->addMonth(),
            'auto_renew' => true,
        ]);
        $future = PartnerSubscription::create([
            'partner_id' => $partner->id,
            'subscription_plan_id' => $this->trialPlan->id,
            'status' => 'pending',
            'starts_at' => Carbon::now()->addDay(),
            'ends_at' => Carbon::now()->addMonths(2),
            'auto_renew' => true,
        ]);
        $this->authenticateAsSuperAdmin();

        $this->postJson("/api/v1/partner-subscriptions/{$current->id}/activate")
            ->assertOk()
            ->assertJsonPath('data.status', 'active');

        $this->postJson("/api/v1/partner-subscriptions/{$future->id}/activate")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('period');
    }

    public function test_active_and_expired_subscriptions_can_be_renewed(): void
    {
        Carbon::setTestNow('2026-08-12 09:00:00');
        $activePartner = $this->createPartner();
        $expiredPartner = $this->createPartner();
        $active = PartnerSubscription::create([
            'partner_id' => $activePartner->id,
            'subscription_plan_id' => $this->trialPlan->id,
            'status' => 'active',
            'starts_at' => Carbon::now()->subMonth(),
            'ends_at' => Carbon::now()->addMonth(),
            'auto_renew' => false,
        ]);
        $expired = PartnerSubscription::create([
            'partner_id' => $expiredPartner->id,
            'subscription_plan_id' => $this->trialPlan->id,
            'status' => 'expired',
            'starts_at' => Carbon::now()->subMonths(2),
            'ends_at' => Carbon::now()->subMonth(),
            'auto_renew' => false,
        ]);
        $this->authenticateAsSuperAdmin();

        $this->postJson("/api/v1/partner-subscriptions/{$active->id}/renew", [
            'periods' => 2,
            'auto_renew' => true,
        ])->assertOk()
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.auto_renew', true);
        $this->assertTrue($active->fresh()->ends_at->equalTo(Carbon::now()->addMonths(3)));

        $this->postJson("/api/v1/partner-subscriptions/{$expired->id}/renew")
            ->assertOk()
            ->assertJsonPath('data.status', 'active');
        $expired->refresh();
        $this->assertTrue($expired->starts_at->equalTo(Carbon::now()));
        $this->assertTrue($expired->ends_at->equalTo(Carbon::now()->addMonth()));
    }

    public function test_active_subscription_plan_cannot_be_changed_during_renewal(): void
    {
        $partner = $this->createPartner();
        $this->activateSubscription($partner);
        $subscription = $partner->subscriptions()->firstOrFail();
        $otherPlan = SubscriptionPlan::create([
            'name' => 'Other Plan',
            'price' => 200000,
            'billing_cycle' => 'monthly',
            'max_booths' => 2,
            'max_devices' => 2,
            'max_operators' => 2,
            'is_active' => true,
        ]);
        $this->authenticateAsSuperAdmin();

        $this->postJson("/api/v1/partner-subscriptions/{$subscription->id}/renew", [
            'subscription_plan_id' => $otherPlan->id,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('subscription_plan_id');
    }

    public function test_super_admin_can_cancel_and_expire_subscriptions(): void
    {
        Carbon::setTestNow('2026-08-12 09:00:00');
        $cancelPartner = $this->createPartner();
        $expirePartner = $this->createPartner();
        $this->activateSubscription($cancelPartner);
        $this->activateSubscription($expirePartner);
        $cancel = $cancelPartner->subscriptions()->firstOrFail();
        $expire = $expirePartner->subscriptions()->firstOrFail();
        $this->authenticateAsSuperAdmin();

        $this->postJson("/api/v1/partner-subscriptions/{$cancel->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.auto_renew', false);
        $this->assertTrue($cancel->fresh()->ends_at->equalTo(Carbon::now()));
        $this->assertNotNull($cancel->fresh()->cancelled_at);

        $this->postJson("/api/v1/partner-subscriptions/{$expire->id}/expire")
            ->assertOk()
            ->assertJsonPath('data.status', 'expired')
            ->assertJsonPath('data.auto_renew', false);
        $this->assertTrue($expire->fresh()->ends_at->equalTo(Carbon::now()));
    }

    public function test_partner_manager_can_only_view_own_subscriptions_and_cannot_mutate(): void
    {
        foreach (['subscriptions.view', 'subscriptions.create', 'subscriptions.update'] as $slug) {
            $this->managerRole->permissions()->attach(Permission::where('slug', $slug)->firstOrFail());
        }

        $partnerA = $this->createPartner();
        $partnerB = $this->createPartner();
        $this->activateSubscription($partnerA);
        $this->activateSubscription($partnerB);
        $manager = User::create([
            'partner_id' => $partnerA->id,
            'role_id' => $this->managerRole->id,
            'name' => 'Subscription Manager',
            'email' => 'subscription-manager@example.test',
            'password' => 'Password123!',
            'status' => 'active',
        ]);
        Sanctum::actingAs($manager);

        $this->getJson("/api/v1/partner-subscriptions?partner_id={$partnerB->id}")
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.partner.id', $partnerA->id);

        $otherSubscription = $partnerB->subscriptions()->firstOrFail();
        $this->getJson("/api/v1/partner-subscriptions/{$otherSubscription->id}")
            ->assertForbidden();

        $this->postJson('/api/v1/partner-subscriptions', [
            'partner_id' => $partnerA->id,
            'subscription_plan_id' => $this->trialPlan->id,
        ])->assertForbidden();

        $ownSubscription = $partnerA->subscriptions()->firstOrFail();
        $this->postJson("/api/v1/partner-subscriptions/{$ownSubscription->id}/cancel")
            ->assertForbidden();
    }

    public function test_expire_command_closes_only_due_active_subscriptions(): void
    {
        Carbon::setTestNow('2026-08-12 09:00:00');
        $duePartner = $this->createPartner();
        $currentPartner = $this->createPartner();
        $due = PartnerSubscription::create([
            'partner_id' => $duePartner->id,
            'subscription_plan_id' => $this->trialPlan->id,
            'status' => 'active',
            'starts_at' => Carbon::now()->subMonths(2),
            'ends_at' => Carbon::now()->subMinute(),
            'auto_renew' => true,
        ]);
        $current = PartnerSubscription::create([
            'partner_id' => $currentPartner->id,
            'subscription_plan_id' => $this->trialPlan->id,
            'status' => 'active',
            'starts_at' => Carbon::now()->subDay(),
            'ends_at' => Carbon::now()->addMonth(),
            'auto_renew' => true,
        ]);

        $this->artisan('subscriptions:expire')
            ->expectsOutput('1 subscription(s) expired.')
            ->assertSuccessful();

        $this->assertSame('expired', $due->fresh()->status);
        $this->assertFalse($due->fresh()->auto_renew);
        $this->assertSame('active', $current->fresh()->status);
    }
}
