<?php

namespace Tests\Feature;

use App\Models\Booth;
use App\Models\Device;
use App\Models\Payment;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

class MidtransPaymentTest extends ApiTestCase
{
    private string $serverKey = 'sandbox-server-key';

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.midtrans.server_key', $this->serverKey);
        config()->set('services.midtrans.api_url', 'https://api.sandbox.midtrans.com');
    }

    public function test_qris_creation_calls_midtrans_once_and_retry_reuses_transaction(): void
    {
        Http::fake([
            'https://api.sandbox.midtrans.com/v2/charge' => Http::response([
                'transaction_id' => 'midtrans-qris-001',
                'transaction_status' => 'pending',
                'qr_string' => '00020101021226...',
                'actions' => [
                    ['name' => 'generate-qr-code', 'url' => 'https://midtrans.test/qr/001'],
                    ['name' => 'deeplink-redirect', 'url' => 'https://midtrans.test/deeplink/001'],
                ],
            ], 201),
        ]);
        [$operator, $device] = $this->desktopContext();
        Sanctum::actingAs($operator);
        $headers = ['X-Device-UUID' => $device->device_uuid];
        $payload = [
            'amount' => 80000,
            'gateway' => 'midtrans_qris',
            'idempotency_key' => 'midtrans-create-001',
        ];

        $first = $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/payments', $payload)
            ->assertCreated()
            ->assertJsonPath('data.gateway_response.environment', 'sandbox')
            ->assertJsonPath('data.gateway_response.transaction_id', 'midtrans-qris-001')
            ->assertJsonPath('data.gateway_response.qr_url', 'https://midtrans.test/qr/001');
        $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/payments', $payload)
            ->assertCreated()
            ->assertJsonPath('data.id', $first->json('data.id'));

        Http::assertSentCount(1);
        Http::assertSent(function (Request $request) use ($first) {
            return $request->url() === 'https://api.sandbox.midtrans.com/v2/charge'
                && $request->hasHeader('Authorization', 'Basic '.base64_encode($this->serverKey.':'))
                && $request['payment_type'] === 'qris'
                && $request['transaction_details']['order_id'] === $first->json('data.reference')
                && $request['transaction_details']['gross_amount'] === 80000;
        });
    }

    public function test_qris_creation_fails_without_configuration_and_does_not_create_payment(): void
    {
        config()->set('services.midtrans.server_key', null);
        [$operator, $device] = $this->desktopContext('missing-config');
        Sanctum::actingAs($operator);

        $this->withHeader('X-Device-UUID', $device->device_uuid)
            ->postJson('/api/v1/desktop/payments', [
                'amount' => 80000,
                'gateway' => 'midtrans_qris',
                'idempotency_key' => 'missing-config-001',
            ])->assertServiceUnavailable();

        $this->assertDatabaseCount('payments', 0);
    }

    public function test_signed_notification_is_idempotent_and_cannot_move_paid_payment_backward(): void
    {
        $payment = $this->pendingPayment();
        $settlement = $this->notification($payment, 'settlement');

        $this->postJson('/api/v1/payments/midtrans/notification', $settlement)
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');
        $this->postJson('/api/v1/payments/midtrans/notification', $settlement)
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');
        $this->postJson(
            '/api/v1/payments/midtrans/notification',
            $this->notification($payment, 'pending')
        )->assertOk()
            ->assertJsonPath('data.status', 'paid');

        $this->assertSame('paid', $payment->fresh()->status);
        $this->assertNotNull($payment->fresh()->paid_at);
    }

    public function test_notification_rejects_invalid_signature_and_amount_mismatch(): void
    {
        $payment = $this->pendingPayment();
        $invalidSignature = $this->notification($payment, 'settlement');
        $invalidSignature['signature_key'] = str_repeat('0', 128);

        $this->postJson('/api/v1/payments/midtrans/notification', $invalidSignature)
            ->assertForbidden();
        $this->assertSame('pending', $payment->fresh()->status);

        $amountMismatch = $this->notification($payment, 'settlement', '90000.00');
        $this->postJson('/api/v1/payments/midtrans/notification', $amountMismatch)
            ->assertUnprocessable();
        $this->assertSame('pending', $payment->fresh()->status);
    }

    public function test_desktop_status_check_refreshes_a_sandbox_payment_without_webhook(): void
    {
        [$operator] = $this->desktopContext('status-refresh');
        $payment = Payment::create([
            'partner_id' => $operator->partner_id,
            'reference' => 'PAY-SANDBOX-STATUS-001',
            'idempotency_key' => 'sandbox-status-001',
            'gateway' => 'midtrans_qris',
            'amount' => 80000,
            'fee' => 0,
            'net_amount' => 80000,
            'status' => 'pending',
            'expired_at' => now()->addMinutes(15),
        ]);
        Http::fake([
            'https://api.sandbox.midtrans.com/v2/PAY-SANDBOX-STATUS-001/status' => Http::response([
                'order_id' => $payment->reference,
                'transaction_id' => 'sandbox-status-transaction',
                'transaction_status' => 'settlement',
                'status_code' => '200',
                'gross_amount' => '80000.00',
            ]),
        ]);
        Sanctum::actingAs($operator);

        $this->getJson('/api/v1/desktop/payments/'.$payment->id)
            ->assertOk()
            ->assertJsonPath('data.status', 'paid')
            ->assertJsonPath('data.gateway_response.status_check.transaction_status', 'settlement');
    }

    private function pendingPayment(): Payment
    {
        $partner = $this->createPartner();

        return Payment::create([
            'partner_id' => $partner->id,
            'reference' => 'PAY-MIDTRANS-NOTIFICATION-001',
            'idempotency_key' => 'notification-payment-001',
            'gateway' => 'midtrans_qris',
            'amount' => 80000,
            'fee' => 0,
            'net_amount' => 80000,
            'status' => 'pending',
            'expired_at' => now()->addMinutes(15),
        ]);
    }

    private function notification(
        Payment $payment,
        string $transactionStatus,
        string $grossAmount = '80000.00'
    ): array {
        $payload = [
            'order_id' => $payment->reference,
            'transaction_id' => 'midtrans-notification-001',
            'transaction_status' => $transactionStatus,
            'fraud_status' => 'accept',
            'status_code' => '200',
            'gross_amount' => $grossAmount,
        ];
        $payload['signature_key'] = hash(
            'sha512',
            $payload['order_id']
                .$payload['status_code']
                .$payload['gross_amount']
                .$this->serverKey
        );

        return $payload;
    }

    private function desktopContext(string $suffix = 'qris'): array
    {
        $partner = $this->createPartner([
            'company_name' => "Midtrans {$suffix}",
            'slug' => "midtrans-{$suffix}",
            'email' => "midtrans-{$suffix}@example.test",
        ]);
        $booth = Booth::create([
            'partner_id' => $partner->id,
            'name' => "Midtrans Booth {$suffix}",
            'status' => 'active',
        ]);
        $operator = $this->createOperator($partner, [
            'email' => "midtrans-operator-{$suffix}@example.test",
        ]);
        $device = Device::create([
            'partner_id' => $partner->id,
            'booth_id' => $booth->id,
            'device_key' => "midtrans-device-{$suffix}",
            'device_uuid' => 'dddddddd-dddd-4ddd-8ddd-'.str_pad((string) (Payment::count() + 1), 12, '0', STR_PAD_LEFT),
            'device_name' => "Midtrans Device {$suffix}",
            'status' => 'active',
        ]);

        return [$operator, $device];
    }
}
