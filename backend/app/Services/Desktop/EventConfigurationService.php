<?php

namespace App\Services\Desktop;

use App\Models\Event;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class EventConfigurationService
{
    public function __construct(protected DeviceService $deviceService) {}

    public function find(
        User $user,
        string $deviceUuid,
        string $eventCode
    ): Event {
        $device = $this->deviceService->findByUuid($deviceUuid);

        if (! $device || $device->status !== 'active' || ! $device->booth_id) {
            throw ValidationException::withMessages([
                'device_uuid' => 'An active device assigned to a booth is required.',
            ]);
        }

        if ($device->partner_id !== $user->partner_id) {
            abort(403, 'The device does not belong to this user.');
        }

        if ($device->booth?->status !== 'active') {
            throw ValidationException::withMessages([
                'device_uuid' => 'The device booth is not active.',
            ]);
        }

        return Event::query()
            ->with([
                'partner',
                'booth',
                'templateSnapshot',
                'filterSnapshot',
                'cameraSnapshot',
                'printerSnapshot',
            ])
            ->where('event_code', strtoupper($eventCode))
            ->where('partner_id', $device->partner_id)
            ->where('booth_id', $device->booth_id)
            ->whereIn('status', ['scheduled', 'ongoing'])
            ->firstOrFail();
    }
}
