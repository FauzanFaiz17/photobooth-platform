<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGateway;
use App\Models\Payment;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MidtransGateway implements PaymentGateway
{
    public function isConfigured(): bool
    {
        return filled(config('services.midtrans.server_key'));
    }

    public function createQrisTransaction(Payment $payment): array
    {
        if (! $this->isConfigured()) {
            abort(503, 'Midtrans is not configured.');
        }

        try {
            $response = Http::withBasicAuth(config('services.midtrans.server_key'), '')
                ->acceptJson()
                ->asJson()
                ->timeout(config('services.midtrans.timeout', 15))
                ->post(config('services.midtrans.api_url').'/v2/charge', [
                    'payment_type' => 'qris',
                    'transaction_details' => [
                        'order_id' => $payment->reference,
                        'gross_amount' => (int) round((float) $payment->amount),
                    ],
                    'custom_field1' => (string) $payment->partner_id,
                ]);
        } catch (ConnectionException $exception) {
            Log::warning('Midtrans QRIS connection failed.', [
                'payment_id' => $payment->id,
                'exception' => $exception->getMessage(),
            ]);

            abort(502, 'Payment gateway is unavailable.');
        }

        if ($response->failed()) {
            Log::warning('Midtrans QRIS request failed.', [
                'payment_id' => $payment->id,
                'status' => $response->status(),
                'response' => $response->json(),
            ]);

            abort(502, 'Payment gateway rejected the transaction.');
        }

        $payload = $response->json();

        return [
            'transaction_id' => $payload['transaction_id'] ?? null,
            'order_id' => $payload['order_id'] ?? $payment->reference,
            'transaction_status' => $payload['transaction_status'] ?? 'pending',
            'fraud_status' => $payload['fraud_status'] ?? null,
            'qr_string' => $payload['qr_string'] ?? null,
            'qr_url' => $this->actionUrl($payload['actions'] ?? [], 'generate-qr-code'),
            'deeplink_url' => $this->actionUrl($payload['actions'] ?? [], 'deeplink-redirect'),
            'expires_at' => $payment->expired_at?->toISOString(),
        ];
    }

    public function verifyNotification(array $payload): bool
    {
        if (! $this->isConfigured()) {
            return false;
        }

        foreach (['order_id', 'status_code', 'gross_amount', 'signature_key'] as $field) {
            if (! isset($payload[$field]) || ! is_string($payload[$field])) {
                return false;
            }
        }

        $expected = hash(
            'sha512',
            $payload['order_id']
                .$payload['status_code']
                .$payload['gross_amount']
                .config('services.midtrans.server_key')
        );

        return hash_equals($expected, $payload['signature_key']);
    }

    public function notificationStatus(array $payload): ?string
    {
        $transactionStatus = strtolower((string) ($payload['transaction_status'] ?? ''));
        $fraudStatus = strtolower((string) ($payload['fraud_status'] ?? 'accept'));

        return match ($transactionStatus) {
            'settlement' => 'paid',
            'capture' => $fraudStatus === 'accept'
                ? 'paid'
                : ($fraudStatus === 'deny' ? 'failed' : null),
            'deny', 'cancel', 'failure' => 'failed',
            'expire' => 'expired',
            'refund', 'partial_refund' => 'refunded',
            'pending' => 'pending',
            default => null,
        };
    }

    private function actionUrl(array $actions, string $name): ?string
    {
        foreach ($actions as $action) {
            if (($action['name'] ?? null) === $name) {
                return $action['url'] ?? null;
            }
        }

        return null;
    }
}
