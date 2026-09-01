<?php

namespace App\Services;

use App\Models\Device;
use App\Models\Payment;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherPackage;
use App\Models\VoucherRedemption;
use Illuminate\Database\QueryException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class VoucherService
{
    public function index(array $filters, User $user): LengthAwarePaginator
    {
        $query = Voucher::query()->with(['package', 'payment']);

        if ($user->isSuperAdmin()) {
            if (! empty($filters['partner_id'])) {
                $query->where('partner_id', $filters['partner_id']);
            }
        } else {
            $query->where('partner_id', $user->partner_id);
        }

        foreach (['voucher_package_id', 'status'] as $field) {
            if (! empty($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }

        if (! empty($filters['search'])) {
            $query->where('code', 'like', "%{$filters['search']}%");
        }

        return $query
            ->orderBy($filters['sort'] ?? 'created_at', $filters['direction'] ?? 'desc')
            ->paginate($filters['per_page'] ?? 10);
    }

    public function issue(array $data, User $user): Voucher
    {
        return DB::transaction(function () use ($data, $user) {
            $partnerId = $user->isSuperAdmin()
                ? ($data['partner_id'] ?? null)
                : $user->partner_id;

            if (! $partnerId) {
                throw ValidationException::withMessages([
                    'partner_id' => 'A partner is required to issue a voucher.',
                ]);
            }

            $existing = Voucher::query()
                ->where('partner_id', $partnerId)
                ->where('idempotency_key', $data['idempotency_key'])
                ->with(['package', 'payment'])
                ->first();

            if ($existing) {
                if ($existing->voucher_package_id !== (int) $data['voucher_package_id']) {
                    throw ValidationException::withMessages([
                        'idempotency_key' => 'The idempotency key was already used for another voucher package.',
                    ]);
                }

                return $existing;
            }

            $package = VoucherPackage::query()
                ->whereKey($data['voucher_package_id'])
                ->where('is_active', true)
                ->where(function ($query) use ($partnerId) {
                    $query->whereNull('partner_id')->orWhere('partner_id', $partnerId);
                })
                ->first();

            if (! $package) {
                throw ValidationException::withMessages([
                    'voucher_package_id' => 'The voucher package is not active or not available to this partner.',
                ]);
            }

            $code = $this->uniqueCode($data['code'] ?? null);

            try {
                return Voucher::create([
                    'partner_id' => $partnerId,
                    'voucher_package_id' => $package->id,
                    'code' => $code,
                    'idempotency_key' => $data['idempotency_key'],
                    'status' => 'unused',
                    'usage_limit' => $package->session_count,
                    'usage_count' => 0,
                    'expired_at' => $data['expired_at'] ?? now()->addDays($package->validity_days),
                    'generated_by' => $user->id,
                ])->load(['package', 'payment']);
            } catch (QueryException $exception) {
                $existing = Voucher::query()
                    ->where('partner_id', $partnerId)
                    ->where('idempotency_key', $data['idempotency_key'])
                    ->with(['package', 'payment'])
                    ->first();

                if ($existing) {
                    return $existing;
                }

                if (Voucher::where('code', $code)->exists()) {
                    throw ValidationException::withMessages([
                        'code' => 'The voucher code has already been used.',
                    ]);
                }

                throw $exception;
            }
        });
    }

    public function redeem(User $user, array $data): array
    {
        $result = DB::transaction(function () use ($user, $data) {
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

            $code = Str::upper(trim($data['code']));
            $voucher = Voucher::query()
                ->with('package')
                ->where('partner_id', $device->partner_id)
                ->where('code', $code)
                ->lockForUpdate()
                ->first();

            if (! $voucher) {
                throw ValidationException::withMessages(['code' => 'Voucher code not found.']);
            }

            if ($voucher->status === 'redeemed' && (int) $voucher->usage_limit === 1) {
                $payment = $voucher->redemptions()->with('payment')->latest('usage_number')->first()?->payment;
                if ($payment) {
                    return ['voucher' => $voucher, 'payment' => $payment];
                }
            }

            if (! in_array($voucher->status, ['unused'], true)) {
                throw ValidationException::withMessages(['code' => 'Voucher is no longer redeemable.']);
            }

            if ($voucher->expired_at->isPast()) {
                $voucher->update(['status' => 'expired']);

                return ['expired' => true];
            }

            $usageNumber = (int) $voucher->usage_count + 1;
            if ($usageNumber > (int) $voucher->usage_limit) {
                $voucher->update(['status' => 'redeemed']);
                throw ValidationException::withMessages(['code' => 'Voucher has no remaining sessions.']);
            }

            $payment = Payment::create([
                'partner_id' => $device->partner_id,
                'reference' => 'VCH-'.$voucher->id.'-'.$usageNumber,
                'gateway' => 'voucher',
                'amount' => $voucher->package->price,
                'fee' => 0,
                'net_amount' => $voucher->package->price,
                'status' => 'paid',
                'voucher_id' => $voucher->id,
                'paid_at' => now(),
                'gateway_response' => ['source' => 'voucher', 'voucher_code' => $voucher->code],
            ]);

            VoucherRedemption::create([
                'voucher_id' => $voucher->id,
                'payment_id' => $payment->id,
                'redeemed_by' => $user->id,
                'redeemed_at' => now(),
                'usage_number' => $usageNumber,
            ]);

            $voucher->update([
                'status' => $usageNumber >= (int) $voucher->usage_limit ? 'redeemed' : 'unused',
                'usage_count' => $usageNumber,
                'redeemed_by' => $user->id,
                'redeemed_at' => now(),
            ]);

            return ['voucher' => $voucher->fresh()->load('package'), 'payment' => $payment];
        });

        if (isset($result['expired'])) {
            throw ValidationException::withMessages(['code' => 'Voucher has expired.']);
        }

        return $result;
    }

    public function void(Voucher $voucher): Voucher
    {
        if ($voucher->status !== 'unused') {
            throw ValidationException::withMessages([
                'status' => 'Only unused vouchers can be voided.',
            ]);
        }

        $voucher->update(['status' => 'void']);

        return $voucher->fresh()->load(['package', 'payment']);
    }

    public function expireDue(): int
    {
        return Voucher::query()
            ->where('status', 'unused')
            ->where('expired_at', '<=', now())
            ->update(['status' => 'expired', 'updated_at' => now()]);
    }

    private function uniqueCode(?string $requested): string
    {
        if ($requested) {
            return Str::upper(trim($requested));
        }

        do {
            $code = 'VCH-'.Str::upper(Str::random(10));
        } while (Voucher::where('code', $code)->exists());

        return $code;
    }
}
