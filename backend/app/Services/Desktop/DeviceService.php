<?php

namespace App\Services\Desktop;

use App\Models\Device;

class DeviceService
{
    public function verify(string $deviceUuid): ?Device
    {
        return Device::with([
                'partner',
                'booth'
            ])
            ->where('device_uuid', $deviceUuid)
            ->first();
    }
}