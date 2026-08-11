<?php

namespace App\Services;

use App\Contracts\PaymentGateway;
use App\Models\Device;
use App\Models\Event;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(protected PaymentGateway $midtrans) {}

    public function index(array $filters, User $user): LengthAwarePaginator
    {
        $query = Payment::query()->with('voucher');

        if ($user->isSuperAdmin()) {
            if (! empty($filters['partner_id'])) {
                $query->where('partner_id', $filters['partner_id']);
            }
        } else {
            $query->where('partner_id', $user->partner_id);
        }

        foreach (['gateway', 'status'] as $field) {
            if (! empty($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }

        if (! empty($filters['search'])) {
            $query->where('reference', 'like', "%{$filters['search']}%");
        }

        return $query
            ->orderBy($filters['sort'] ?? 'created_at', $filters['direction'] ?? 'desc')
            ->paginate($filters['per_page'] ?? 10);
    }

    public function createForDesktop(User $user, array $data): Payment
    {
        if ($data['gateway'] === 'midtrans_qris' && ! $this->midtrans->isConfigured()) {
            abort(503, 'Midtrans is not configured.');
        }

        $payment = DB::transaction(function () use ($user, $data) {
            $device = Device::query()
                ->with('booth')
                ->where('device_uuid', $data['device_uuid'])
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if (! $device || ! $device->booth || $device->booth->status !== 'active') {
                throw ValidationException::withMessages([
                    'device_uuid' => 'An active device assigned to an active booth is required.',
                ]);
            }

            if ($device->partner_id !== $user->partner_id) {
                abort(403, 'The device does not belong to this user.');
            }

            $amount = $this->resolveAmount($device, $data);
            $existing = Payment::query()
                ->where('partner_id', $device->partner_id)
                ->where('idempotency_key', $data['idempotency_key'])
                ->first();

            if ($existing) {
                if ($existing->gateway !== $data['gateway']
                    || (float) $existing->amount !== $amount) {
                    throw ValidationException::withMessages([
                        'idempotency_key' => 'The idempotency key was already used for another payment payload.',
                    ]);
                }

                return $existing;
            }

            $status = $data['gateway'] === 'cash' ? 'paid' : 'pending';
            $now = now();

            try {
                return Payment::create([
                    'partner_id' => $device->partner_id,
                    'reference' => 'PAY-'.Str::upper(str_replace('-', '', (string) Str::uuid())),
                    'idempotency_key' => $data['idempotency_key'],
                    'gateway' => $data['gateway'],
                    'amount' => $amount,
                    'fee' => 0,
                    'net_amount' => $amount,
                    'status' => $status,
                    'expired_at' => $status === 'pending' ? $now->copy()->addMinutes(15) : null,
                    'paid_at' => $status === 'paid' ? $now : null,
                    'gateway_response' => $status === 'pending'
                        ? ['state' => 'awaiting_gateway_confirmation']
                        : ['source' => 'cash'],
                ]);
            } catch (QueryException $exception) {
                $existing = Payment::query()
                    ->where('partner_id', $device->partner_id)
                    ->where('idempotency_key', $data['idempotency_key'])
                    ->first();

                if ($existing) {
                    return $existing;
                }

                throw $exception;
            }
        });

        if ($payment->gateway !== 'midtrans_qris') {
            return $payment;
        }

        return Cache::lock("payment-gateway-init:{$payment->id}", 30)
            ->block(10, function () use ($payment) {
                $payment->refresh();

                if (! empty($payment->gateway_response['transaction_id'])) {
                    return $payment;
                }

                $gatewayResponse = $this->midtrans->createQrisTransaction($payment);
                $payment->update(['gateway_response' => $gatewayResponse]);

                return $payment->fresh();
            });
    }

    public function transition(Payment $payment, string $targetStatus, ?array $gatewayResponse = null): Payment
    {
        return DB::transaction(function () use ($payment, $targetStatus, $gatewayResponse) {
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            if ($payment->status === $targetStatus) {
                return $payment->load('voucher');
            }

            if ($payment->gateway === 'voucher') {
                throw ValidationException::withMessages([
                    'status' => 'Voucher payments cannot be transitioned manually.',
                ]);
            }

            $allowed = [
                'pending' => ['paid', 'failed', 'expired'],
                'paid' => ['refunded'],
                'failed' => [],
                'expired' => [],
                'refunded' => [],
            ];

            if (! in_array($targetStatus, $allowed[$payment->status] ?? [], true)) {
                throw ValidationException::withMessages([
                    'status' => "Payment cannot transition from {$payment->status} to {$targetStatus}.",
                ]);
            }

            $attributes = [
                'status' => $targetStatus,
                'gateway_response' => array_merge(
                    $payment->gateway_response ?? [],
                    $gatewayResponse ?? []
                ),
            ];

            if ($targetStatus === 'paid') {
                $attributes['paid_at'] = $payment->paid_at ?? now();
                $attributes['expired_at'] = null;
            } elseif ($targetStatus === 'expired') {
                $attributes['expired_at'] = $payment->expired_at ?? now();
            }

            $payment->update($attributes);

            return $payment->fresh()->load('voucher');
        });
    }

    public function expireDue(): int
    {
        return Payment::query()
            ->where('status', 'pending')
            ->whereNotNull('expired_at')
            ->where('expired_at', '<=', now())
            ->update([
                'status' => 'expired',
                'updated_at' => now(),
            ]);
    }

    public function handleMidtransNotification(array $payload): Payment
    {
        if (! $this->midtrans->verifyNotification($payload)) {
            abort(403, 'Invalid Midtrans signature.');
        }

        return DB::transaction(function () use ($payload) {
            $payment = Payment::query()
                ->where('reference', $payload['order_id'])
                ->where('gateway', 'midtrans_qris')
                ->lockForUpdate()
                ->firstOrFail();

            if (number_format((float) $payment->amount, 2, '.', '')
                !== number_format((float) $payload['gross_amount'], 2, '.', '')) {
                abort(422, 'Midtrans payment amount does not match.');
            }

            $targetStatus = $this->midtrans->notificationStatus($payload);

            if ($targetStatus === null || $targetStatus === 'pending') {
                return $payment;
            }

            if ($payment->status === $targetStatus) {
                return $payment;
            }

            $allowed = [
                'pending' => ['paid', 'failed', 'expired'],
                'paid' => ['refunded'],
            ];

            if (! in_array($targetStatus, $allowed[$payment->status] ?? [], true)) {
                return $payment;
            }

            $attributes = [
                'status' => $targetStatus,
                'gateway_response' => array_merge($payment->gateway_response ?? [], [
                    'notification' => [
                        'transaction_id' => $payload['transaction_id'] ?? null,
                        'transaction_status' => $payload['transaction_status'] ?? null,
                        'fraud_status' => $payload['fraud_status'] ?? null,
                        'status_code' => $payload['status_code'],
                    ],
                ]),
            ];

            if ($targetStatus === 'paid') {
                $attributes['paid_at'] = $payment->paid_at ?? now();
                $attributes['expired_at'] = null;
            } elseif ($targetStatus === 'expired') {
                $attributes['expired_at'] = $payment->expired_at ?? now();
            }

            $payment->update($attributes);

            return $payment->fresh();
        });
    }

    private function resolveAmount(Device $device, array $data): float
    {
        if (! empty($data['event_id'])) {
            $event = Event::query()
                ->whereKey($data['event_id'])
                ->where('partner_id', $device->partner_id)
                ->where('booth_id', $device->booth_id)
                ->first();

            if (! $event) {
                throw ValidationException::withMessages([
                    'event_id' => 'The event must belong to the device booth.',
                ]);
            }

            if (isset($data['amount']) && (float) $data['amount'] !== (float) $event->price) {
                throw ValidationException::withMessages([
                    'amount' => 'The amount must match the event price.',
                ]);
            }

            return (float) $event->price;
        }

        if (! isset($data['amount'])) {
            throw ValidationException::withMessages([
                'amount' => 'An amount or event_id is required.',
            ]);
        }

        return (float) $data['amount'];
    }
}
