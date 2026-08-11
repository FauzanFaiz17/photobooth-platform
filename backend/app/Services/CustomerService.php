<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Device;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CustomerService
{
    public function index(array $filters, User $user): LengthAwarePaginator
    {
        $query = Customer::query()->withCount('photoSessions');

        if ($user->isSuperAdmin()) {
            if (! empty($filters['partner_id'])) {
                $query->where('partner_id', $filters['partner_id']);
            }
        } else {
            $query->where('partner_id', $user->partner_id);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($nested) use ($search) {
                $nested->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $query
            ->orderBy($filters['sort'] ?? 'created_at', $filters['direction'] ?? 'desc')
            ->paginate($filters['per_page'] ?? 10);
    }

    public function resolve(User $user, array $data): Customer
    {
        $device = Device::query()
            ->with('booth')
            ->where('device_uuid', $data['device_uuid'])
            ->where('status', 'active')
            ->first();

        if (! $device || ! $device->booth || $device->booth->status !== 'active') {
            throw ValidationException::withMessages([
                'device_uuid' => 'An active device assigned to an active booth is required.',
            ]);
        }

        if ($device->partner_id !== $user->partner_id) {
            abort(403, 'The device does not belong to this user.');
        }

        $phone = $this->normalizePhone($data['phone'] ?? null);
        $email = isset($data['email']) ? Str::lower(trim($data['email'])) : null;

        return DB::transaction(function () use ($device, $data, $phone, $email) {
            $phoneMatch = $phone
                ? Customer::withTrashed()->where('partner_id', $device->partner_id)->where('phone', $phone)->first()
                : null;
            $emailMatch = $email
                ? Customer::withTrashed()->where('partner_id', $device->partner_id)->where('email', $email)->first()
                : null;

            if ($phoneMatch && $emailMatch && $phoneMatch->id !== $emailMatch->id) {
                throw ValidationException::withMessages([
                    'customer' => 'The phone and email belong to different customer records.',
                ]);
            }

            $customer = $phoneMatch ?? $emailMatch;
            $attributes = array_filter([
                'name' => isset($data['name']) ? trim($data['name']) : null,
                'phone' => $phone,
                'email' => $email,
            ], fn ($value) => $value !== null && $value !== '');

            if ($customer) {
                if ($customer->trashed()) {
                    $customer->restore();
                }
                $customer->fill($attributes)->save();

                return $customer->fresh();
            }

            try {
                return Customer::create(array_merge($attributes, [
                    'partner_id' => $device->partner_id,
                ]));
            } catch (QueryException $exception) {
                $customer = Customer::withTrashed()->where('partner_id', $device->partner_id)
                    ->where(function ($query) use ($phone, $email) {
                        if ($phone) {
                            $query->orWhere('phone', $phone);
                        }
                        if ($email) {
                            $query->orWhere('email', $email);
                        }
                    })
                    ->first();

                if ($customer) {
                    if ($customer->trashed()) {
                        $customer->restore();
                    }

                    return $customer;
                }

                throw $exception;
            }
        });
    }

    private function normalizePhone(?string $phone): ?string
    {
        if (! $phone) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone);

        if (str_starts_with($digits, '62')) {
            return '0'.substr($digits, 2);
        }

        if (str_starts_with($digits, '8')) {
            return '0'.$digits;
        }

        return $digits;
    }
}
