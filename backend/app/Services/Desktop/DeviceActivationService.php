<?php

namespace App\Services\Desktop;

use App\Models\Device;
use App\Services\SubscriptionLimitService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DeviceActivationService
{
    public function __construct(
        protected SubscriptionLimitService $limitService
    ) {}

    public function activate(array $data): Device
    {
        return DB::transaction(function () use ($data) {
            $hash = hash('sha256', Str::upper(trim($data['activation_code'])));

            $device = Device::query()
                ->with(['partner', 'booth'])
                ->where('activation_code_hash', $hash)
                ->lockForUpdate()
                ->first();

            if (! $device || $device->status !== 'pending') {
                throw ValidationException::withMessages([
                    'activation_code' => 'Activation code is invalid or has already been used.',
                ]);
            }

            if (! $device->activation_expires_at || $device->activation_expires_at->isPast()) {
                throw ValidationException::withMessages([
                    'activation_code' => 'Activation code has expired.',
                ]);
            }

            if (! $device->booth || $device->booth->status !== 'active') {
                throw ValidationException::withMessages([
                    'activation_code' => 'The assigned booth is not active.',
                ]);
            }

            $this->limitService->ensureSubscriptionIsActive($device->partner);

            $duplicate = Device::query()
                ->where('device_uuid', $data['device_uuid'])
                ->whereKeyNot($device->id)
                ->exists();

            if ($duplicate) {
                throw ValidationException::withMessages([
                    'device_uuid' => 'This computer is already registered as another device.',
                ]);
            }

            $device->update([
                'device_uuid' => $data['device_uuid'],
                'windows_uuid' => $data['windows_uuid'] ?? null,
                'cpu_identifier' => $data['cpu_identifier'] ?? null,
                'mac_address' => $data['mac_address'] ?? null,
                'app_version' => $data['app_version'] ?? null,
                'activation_code_hash' => null,
                'activation_expires_at' => null,
                'activated_at' => now(),
                'last_sync_at' => now(),
                'status' => 'active',
            ]);

            return $device->fresh()->load(['partner', 'booth']);
        });
    }
}
