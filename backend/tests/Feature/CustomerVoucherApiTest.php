<?php

namespace Tests\Feature;

use App\Models\Booth;
use App\Models\Customer;
use App\Models\Device;
use App\Models\Partner;
use App\Models\Payment;
use App\Models\Permission;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherPackage;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

class CustomerVoucherApiTest extends ApiTestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_desktop_customer_resolution_is_tenant_scoped_and_idempotent(): void
    {
        [$operator, $device] = $this->desktopContext('customer');
        Sanctum::actingAs($operator);

        $first = $this->withHeader('X-Device-UUID', $device->device_uuid)
            ->postJson('/api/v1/desktop/customers/resolve', [
                'name' => '  Siti Customer  ',
                'phone' => '+62 812-3456-789',
                'email' => 'SITI@example.test',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Siti Customer')
            ->assertJsonPath('data.phone', '08123456789')
            ->assertJsonPath('data.email', 'siti@example.test');

        $customerId = $first->json('data.id');

        $this->withHeader('X-Device-UUID', $device->device_uuid)
            ->postJson('/api/v1/desktop/customers/resolve', [
                'name' => 'Siti Updated',
                'phone' => '08123456789',
            ])
            ->assertOk()
            ->assertJsonPath('data.id', $customerId)
            ->assertJsonPath('data.name', 'Siti Updated');

        $this->assertDatabaseCount('customers', 1);
    }

    public function test_desktop_customer_can_be_resolved_with_name_only(): void
    {
        [$operator, $device] = $this->desktopContext('name-only');
        Sanctum::actingAs($operator);

        $this->withHeader('X-Device-UUID', $device->device_uuid)
            ->postJson('/api/v1/desktop/customers/resolve', ['name' => 'Nama Saja'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Nama Saja')
            ->assertJsonPath('data.phone', null)
            ->assertJsonPath('data.email', null);
    }

    public function test_customer_list_is_limited_to_the_authenticated_partner(): void
    {
        foreach (['customers.view'] as $slug) {
            $this->managerRole->permissions()->attach(Permission::where('slug', $slug)->firstOrFail());
        }

        $partnerA = $this->createPartner();
        $partnerB = $this->createPartner();
        $manager = User::create([
            'partner_id' => $partnerA->id,
            'role_id' => $this->managerRole->id,
            'name' => 'Customer Manager',
            'email' => 'customer-manager@example.test',
            'password' => 'Password123!',
            'status' => 'active',
        ]);
        Customer::create(['partner_id' => $partnerA->id, 'name' => 'A', 'phone' => '08111']);
        Customer::create(['partner_id' => $partnerB->id, 'name' => 'B', 'phone' => '08222']);
        Sanctum::actingAs($manager);

        $this->getJson('/api/v1/customers')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.name', 'A');
    }

    public function test_super_admin_can_manage_packages_and_partner_users_see_global_and_own_packages(): void
    {
        $partner = $this->createPartner();
        $this->authenticateAsSuperAdmin();

        $global = $this->postJson('/api/v1/voucher-packages', $this->packagePayload())
            ->assertCreated()
            ->assertJsonPath('data.partner_id', null);
        $partnerPackage = $this->postJson('/api/v1/voucher-packages', array_merge(
            $this->packagePayload('Partner Package'),
            ['partner_id' => $partner->id]
        ))->assertCreated();

        $this->assertNotSame($global->json('data.id'), $partnerPackage->json('data.id'));

        foreach (['vouchers.view', 'vouchers.create', 'vouchers.update', 'vouchers.delete'] as $slug) {
            $this->managerRole->permissions()->attach(Permission::where('slug', $slug)->firstOrFail());
        }
        $manager = User::create([
            'partner_id' => $partner->id,
            'role_id' => $this->managerRole->id,
            'name' => 'Voucher Manager',
            'email' => 'voucher-manager@example.test',
            'password' => 'Password123!',
            'status' => 'active',
        ]);
        Sanctum::actingAs($manager);

        $this->getJson('/api/v1/voucher-packages')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);
        $this->putJson('/api/v1/voucher-packages/'.$global->json('data.id'), $this->packagePayload('Illegal Update'))
            ->assertForbidden();
    }

    public function test_voucher_issue_is_idempotent_and_rejects_key_reuse_for_another_package(): void
    {
        $partner = $this->createPartner();
        $this->authenticateAsSuperAdmin();
        $package = $this->postJson('/api/v1/voucher-packages', array_merge(
            $this->packagePayload(),
            ['partner_id' => $partner->id]
        ))->json('data.id');
        $payload = [
            'partner_id' => $partner->id,
            'voucher_package_id' => $package,
            'idempotency_key' => 'issue-request-001',
        ];

        $first = $this->postJson('/api/v1/vouchers', $payload)
            ->assertCreated();
        $second = $this->postJson('/api/v1/vouchers', $payload)
            ->assertCreated()
            ->assertJsonPath('data.id', $first->json('data.id'));
        $this->assertDatabaseCount('vouchers', 1);

        $otherPackage = $this->postJson('/api/v1/voucher-packages', array_merge(
            $this->packagePayload('Other Package'),
            ['partner_id' => $partner->id]
        ))->json('data.id');
        $this->postJson('/api/v1/vouchers', array_merge($payload, [
            'voucher_package_id' => $otherPackage,
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors('idempotency_key');
    }

    public function test_voucher_redemption_creates_one_paid_payment_and_can_be_retried(): void
    {
        [$operator, $device] = $this->desktopContext('voucher-redeem');
        $this->authenticateAsSuperAdmin();
        $package = $this->postJson('/api/v1/voucher-packages', array_merge(
            $this->packagePayload('Redeem Package'),
            ['partner_id' => $operator->partner_id, 'price' => 75000]
        ))->json('data.id');
        $voucher = $this->postJson('/api/v1/vouchers', [
            'partner_id' => $operator->partner_id,
            'voucher_package_id' => $package,
            'idempotency_key' => 'redeem-issue-001',
            'code' => 'customer-voucher-001',
        ])->json('data');

        Sanctum::actingAs($operator);
        $headers = ['X-Device-UUID' => $device->device_uuid];
        $redeemed = $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/vouchers/redeem', ['code' => $voucher['code']])
            ->assertOk()
            ->assertJsonPath('data.voucher.status', 'redeemed')
            ->assertJsonPath('data.payment.status', 'paid')
            ->assertJsonPath('data.payment.gateway', 'voucher');
        $paymentId = $redeemed->json('data.payment.id');

        $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/vouchers/redeem', ['code' => $voucher['code']])
            ->assertOk()
            ->assertJsonPath('data.payment.id', $paymentId);
        $this->assertDatabaseCount('payments', 1);

        $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/photo-sessions', ['payment_id' => $paymentId])
            ->assertCreated()
            ->assertJsonPath('data.payment_id', $paymentId);
    }

    public function test_expired_and_void_vouchers_cannot_be_redeemed(): void
    {
        Carbon::setTestNow('2026-08-12 10:00:00');
        [$operator, $device] = $this->desktopContext('voucher-state');
        $this->authenticateAsSuperAdmin();
        $package = $this->postJson('/api/v1/voucher-packages', array_merge(
            $this->packagePayload('State Package'),
            ['partner_id' => $operator->partner_id]
        ))->json('data.id');
        $expired = $this->postJson('/api/v1/vouchers', [
            'partner_id' => $operator->partner_id,
            'voucher_package_id' => $package,
            'idempotency_key' => 'expired-issue',
            'expired_at' => Carbon::now()->addMinute()->toISOString(),
            'code' => 'expired-code',
        ])->json('data');
        $void = $this->postJson('/api/v1/vouchers', [
            'partner_id' => $operator->partner_id,
            'voucher_package_id' => $package,
            'idempotency_key' => 'void-issue',
            'code' => 'void-code',
        ])->json('data');
        $this->postJson('/api/v1/vouchers/'.$void['id'].'/void')->assertOk();
        Carbon::setTestNow('2026-08-12 12:00:00');

        Sanctum::actingAs($operator);
        $headers = ['X-Device-UUID' => $device->device_uuid];
        $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/vouchers/redeem', ['code' => $expired['code']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code');
        $this->assertSame('expired', Voucher::findOrFail($expired['id'])->status);
        $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/vouchers/redeem', ['code' => $void['code']])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code');
    }

    public function test_voucher_expiry_command_and_payment_tenant_list(): void
    {
        Carbon::setTestNow('2026-08-12 10:00:00');
        $partner = $this->createPartner();
        $package = VoucherPackage::create(array_merge($this->packagePayload(), ['partner_id' => $partner->id]));
        $voucher = Voucher::create([
            'partner_id' => $partner->id,
            'voucher_package_id' => $package->id,
            'code' => 'due-voucher',
            'idempotency_key' => 'due-voucher-key',
            'expired_at' => Carbon::now()->subMinute(),
            'generated_by' => $this->superAdmin->id,
        ]);
        $this->artisan('vouchers:expire')
            ->expectsOutput('1 voucher(s) expired.')
            ->assertSuccessful();
        $this->assertSame('expired', $voucher->fresh()->status);

        Payment::create([
            'partner_id' => $partner->id,
            'reference' => 'PAY-001',
            'gateway' => 'cash',
            'amount' => 10000,
            'fee' => 0,
            'net_amount' => 10000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);
        $this->authenticateAsSuperAdmin();
        $this->getJson('/api/v1/payments?partner_id='.$partner->id)
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.reference', 'PAY-001');
    }

    private function packagePayload(string $name = 'Basic Voucher'): array
    {
        return [
            'name' => $name,
            'price' => 50000,
            'persons' => 2,
            'captures' => 4,
            'print_count' => 2,
            'gif_included' => false,
            'video_included' => false,
            'validity_days' => 30,
            'is_active' => true,
        ];
    }

    private function desktopContext(string $suffix): array
    {
        $partner = $this->createPartner([
            'company_name' => "Voucher {$suffix}",
            'slug' => "voucher-{$suffix}",
            'email' => "voucher-{$suffix}@example.test",
        ]);
        $booth = Booth::create([
            'partner_id' => $partner->id,
            'name' => "Voucher Booth {$suffix}",
            'status' => 'active',
        ]);
        $operator = $this->createOperator($partner, [
            'email' => "voucher-operator-{$suffix}@example.test",
        ]);
        $device = Device::create([
            'partner_id' => $partner->id,
            'booth_id' => $booth->id,
            'device_key' => "voucher-device-{$suffix}",
            'device_uuid' => 'bbbbbbbb-bbbb-4bbb-8bbb-'.str_pad((string) (Partner::count() + 1), 12, '0', STR_PAD_LEFT),
            'device_name' => "Voucher Device {$suffix}",
            'status' => 'active',
        ]);

        return [$operator, $device];
    }
}
