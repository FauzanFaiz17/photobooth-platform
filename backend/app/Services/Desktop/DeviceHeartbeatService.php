<?php

namespace App\Services\Desktop;

use App\Models\Device;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeviceHeartbeatService
{
    public function record(User $user, array $data): Device
    {
        return DB::transaction(function () use ($user, $data) {
            $device = Device::query()
                ->with(['partner', 'booth'])
                ->where('device_uuid', $data['device_uuid'])
                ->lockForUpdate()
                ->first();

            if (! $device || $device->status !== 'active') {
                throw ValidationException::withMessages([
                    'device_uuid' => 'An active device was not found.',
                ]);
            }

            if ($device->partner_id !== $user->partner_id) {
                abort(403, 'The device does not belong to this user.');
            }

            if (! $device->booth || $device->booth->status !== 'active') {
                throw ValidationException::withMessages([
                    'device_uuid' => 'The device must be assigned to an active booth.',
                ]);
            }

            $device->update([
                'last_sync_at' => now(),
                'app_version' => $data['app_version'] ?? $device->app_version,
            ]);

            return $device->fresh()->load(['partner', 'booth']);
        });
    }
}
