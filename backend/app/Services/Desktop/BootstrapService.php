<?php

namespace App\Services\Desktop;

use App\Models\User;

class BootstrapService
{
    public function __construct(
        protected DeviceService $deviceService
    ) {}

    public function handle(
        User $user,
        ?string $deviceUuid
    ): array {

        $device = null;

        if ($deviceUuid) {

            $device = $this->deviceService
                ->findByUuid($deviceUuid);

        }

        return [

            'user' => $user,

            'device' => $device,

            'partner' => $device?->partner,

            'booth' => $device?->booth,

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