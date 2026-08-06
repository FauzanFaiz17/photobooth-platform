<?php

namespace App\Services\Desktop;

use App\Models\User;
use Illuminate\Validation\ValidationException;

class BootstrapService
{
    public function __construct(
        protected DeviceService $deviceService
    ) {}

    public function handle(
        User $user,
        string $deviceUuid
    ): array {
        $device = $this->deviceService->findByUuid($deviceUuid);

        if (! $device || $device->status !== 'active') {
            throw ValidationException::withMessages([
                'device_uuid' => 'Active device was not found.',
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

        return [

            'user' => $user,

            'device' => $device,

            'partner' => $device->partner,

            'booth' => $device->booth,

            'application' => [

                'current_version' => config(
                    'app.version',
                    '1.0.0'
                ),

                'minimum_version' => '1.0.0',

            ],

            'server' => [

                'time' => now(),

            ],

        ];

    }
}
