<?php

namespace Tests\Feature;

use App\Models\Booth;
use App\Models\Device;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

class PaymentLifecycleApiTest extends ApiTestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_desktop_cash_payment_is_paid_and_idempotent(): void
    {
        [$operator, $device] = $this->desktopContext();
        Sanctum::actingAs($operator);
        $headers = ['X-Device-UUID' => $device->device_uuid];
        $payload = [
            'amount' => 50000,
            'gateway' => 'cash',
            'idempotency_key' => 'cash-payment-001',
        ];

        $first = $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/payments', $payload)
            ->assertCreated()
            ->assertJsonPath('data.status', 'paid')
            ->assertJsonPath('data.gateway', 'cash');
        $second = $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/payments', $payload)
            ->assertCreated()
            ->assertJsonPath('data.id', $first->json('data.id'));

        $this->assertDatabaseCount('payments', 1);
        $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/payments', array_merge($payload, ['amount' => 70000]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('idempotency_key');
    }

    public function test_external_gateway_payment_starts_pending_and_follows_monotonic_transitions(): void
    {
        config()->set('services.midtrans.server_key', 'sandbox-server-key');
        config()->set('services.midtrans.api_url', 'https://api.sandbox.midtrans.com');
        Http::fake([
            'https://api.sandbox.midtrans.com/v2/charge' => Http::response([
                'transaction_id' => 'midtrans-001',
                'transaction_status' => 'pending',
                'actions' => [[
                    'name' => 'generate-qr-code',
                    'url' => 'https://api.sandbox.midtrans.com/qr/001',
                ]],
            ]),
        ]);
        [$operator, $device] = $this->desktopContext('gateway');
        Sanctum::actingAs($operator);
        $payment = $this->withHeader('X-Device-UUID', $device->device_uuid)
            ->postJson('/api/v1/desktop/payments', [
                'amount' => 125000,
                'gateway' => 'midtrans_qris',
                'idempotency_key' => 'qris-payment-001',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.gateway_response.qr_url', 'https://api.sandbox.midtrans.com/qr/001')
            ->json('data');

        $this->authenticateAsSuperAdmin();
        $this->postJson("/api/v1/payments/{$payment['id']}/transition", [
            'status' => 'paid',
            'gateway_response' => ['transaction_id' => 'midtrans-001'],
        ])->assertOk()
            ->assertJsonPath('data.status', 'paid')
            ->assertJsonPath('data.gateway_response.transaction_id', 'midtrans-001');

        $this->postJson("/api/v1/payments/{$payment['id']}/transition", [
            'status' => 'paid',
        ])->assertOk();
        $this->postJson("/api/v1/payments/{$payment['id']}/transition", [
            'status' => 'failed',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('status');
        $this->postJson("/api/v1/payments/{$payment['id']}/transition", [
            'status' => 'refunded',
        ])->assertOk()
            ->assertJsonPath('data.status', 'refunded');
        $this->postJson("/api/v1/payments/{$payment['id']}/transition", [
            'status' => 'paid',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('status');
    }

    public function test_voucher_payment_cannot_be_manually_transitioned(): void
    {
        $partner = $this->createPartner();
        $payment = Payment::create([
            'partner_id' => $partner->id,
            'reference' => 'VCH-MANUAL-001',
            'gateway' => 'voucher',
            'amount' => 50000,
            'fee' => 0,
            'net_amount' => 50000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);
        $this->authenticateAsSuperAdmin();

        $this->postJson("/api/v1/payments/{$payment->id}/transition", [
            'status' => 'refunded',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('status');
    }

    public function test_pending_payment_expiry_command_does_not_touch_paid_payment(): void
    {
        Carbon::setTestNow('2026-08-12 10:00:00');
        $partner = $this->createPartner();
        $pending = Payment::create([
            'partner_id' => $partner->id,
            'reference' => 'PENDING-DUE-001',
            'gateway' => 'midtrans_qris',
            'amount' => 50000,
            'fee' => 0,
            'net_amount' => 50000,
            'status' => 'pending',
            'expired_at' => Carbon::now()->subMinute(),
        ]);
        $paid = Payment::create([
            'partner_id' => $partner->id,
            'reference' => 'PAID-NOT-DUE-001',
            'gateway' => 'cash',
            'amount' => 50000,
            'fee' => 0,
            'net_amount' => 50000,
            'status' => 'paid',
            'paid_at' => Carbon::now()->subHour(),
        ]);

        $this->artisan('payments:expire')
            ->expectsOutput('1 payment(s) expired.')
            ->assertSuccessful();

        $this->assertSame('expired', $pending->fresh()->status);
        $this->assertSame('paid', $paid->fresh()->status);
    }

    private function desktopContext(string $suffix = 'payment'): array
    {
        $partner = $this->createPartner([
            'company_name' => "Payment {$suffix}",
            'slug' => "payment-{$suffix}",
            'email' => "payment-{$suffix}@example.test",
        ]);
        $booth = Booth::create([
            'partner_id' => $partner->id,
            'name' => "Payment Booth {$suffix}",
            'status' => 'active',
        ]);
        $operator = $this->createOperator($partner, [
            'email' => "payment-operator-{$suffix}@example.test",
        ]);
        $device = Device::create([
            'partner_id' => $partner->id,
            'booth_id' => $booth->id,
            'device_key' => "payment-device-{$suffix}",
            'device_uuid' => 'cccccccc-cccc-4ccc-8ccc-'.str_pad((string) (Payment::count() + 1), 12, '0', STR_PAD_LEFT),
            'device_name' => "Payment Device {$suffix}",
            'status' => 'active',
        ]);

        return [$operator, $device];
    }
}
