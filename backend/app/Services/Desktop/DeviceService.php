<?php

namespace App\Services\Desktop;

use App\Models\Device;

class DeviceService
{
    public function findByUuid(
        string $uuid
    ): ?Device {

        return Device::with([
                'partner',
                'booth',
            ])
            ->where(
                'device_uuid',
                $uuid
            )
            ->first();

    }

    public function verify(
        string $uuid
    ): ?Device {

        $device = $this->findByUuid(
            $uuid
        );

        if (!$device) {

            return null;

        }

        if ($device->status !== 'active') {

            return null;

        }

        return $device;

    }
}