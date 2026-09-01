<?php

namespace App\Services\Desktop;

use App\Contracts\MediaStorage;
use App\Models\Customer;
use App\Models\Device;
use App\Models\DownloadToken;
use App\Models\Event;
use App\Models\Media;
use App\Models\Payment;
use App\Models\PhotoSession;
use App\Models\User;
use App\Services\AuditService;
use App\Services\PrintJobService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PhotoSessionService
{
    public function __construct(
        protected MediaStorage $storage,
        protected AuditService $auditService,
        protected PrintJobService $printJobService
    ) {}

    public function create(
        User $user,
        string $deviceUuid,
        array $data
    ): PhotoSession {
        $device = $this->activeDeviceForUser($user, $deviceUuid);

        $this->validateReferences($device, $data);

        return DB::transaction(function () use ($user, $device, $data) {
            return PhotoSession::create([
                'partner_id' => $device->partner_id,
                'booth_id' => $device->booth_id,
                'device_id' => $device->id,
                'operator_id' => $user->id,
                'event_id' => $data['event_id'] ?? null,
                'customer_id' => $data['customer_id'] ?? null,
                'payment_id' => $data['payment_id'] ?? null,
                'download_token' => Str::random(64),
                'status' => 'started',
            ]);
        });
    }

    public function storeMedia(
        PhotoSession $photoSession,
        User $user,
        string $deviceUuid,
        array $data
    ): Media {
        $this->ensureSessionAccess($photoSession, $user, $deviceUuid);

        if ($photoSession->status !== 'started') {
            throw ValidationException::withMessages([
                'photo_session' => 'Media can only be added to a started session.',
            ]);
        }

        [$mimeType, $binary] = $this->decodeDataUrl($data['data_url']);

        if ($mimeType !== $data['mime_type']) {
            throw ValidationException::withMessages([
                'mime_type' => 'The MIME type does not match data_url.',
            ]);
        }

        $checksum = hash('sha256', $binary);
        $existingMedia = $photoSession->media()
            ->where('type', $data['type'])
            ->where('filename', $data['filename'])
            ->where('checksum', $checksum)
            ->first();

        if ($existingMedia) {
            return $existingMedia;
        }

        $scope = $photoSession->event_id
            ? sprintf('partners/%d/events/%d/sessions/%d', $photoSession->partner_id, $photoSession->event_id, $photoSession->id)
            : sprintf('partners/%d/sessions/%d', $photoSession->partner_id, $photoSession->id);
        $objectKey = sprintf('%s/%s-%s', $scope, Str::uuid(), $data['filename']);

        if (! $this->storage->put($objectKey, $binary)) {
            throw ValidationException::withMessages([
                'data_url' => 'Media could not be stored.',
            ]);
        }

        try {
            $media = $photoSession->media()->create([
                'type' => $data['type'],
                'bucket' => $this->storage->bucketName(),
                'object_key' => $objectKey,
                'filename' => $data['filename'],
                'mime_type' => $mimeType,
                'size_bytes' => strlen($binary),
                'checksum' => $checksum,
                'width' => $data['width'] ?? null,
                'height' => $data['height'] ?? null,
                'duration_seconds' => $data['duration_seconds'] ?? null,
                'visibility' => 'private',
            ]);
            $this->auditService->record('upload', $user, $media, 'Session media uploaded.', [
                'photo_session_id' => $photoSession->id,
                'type' => $media->type,
                'size_bytes' => $media->size_bytes,
            ], $photoSession->partner_id);

            return $media;
        } catch (\Throwable $exception) {
            $this->storage->delete($objectKey, $this->storage->bucketName());
            throw $exception;
        }
    }

    public function complete(
        PhotoSession $photoSession,
        User $user,
        string $deviceUuid,
        bool $printedLocally = false
    ): PhotoSession {
        $this->ensureSessionAccess($photoSession, $user, $deviceUuid);

        if ($photoSession->status === 'completed') {
            $this->ensureDownloadToken($photoSession);
            if (! $printedLocally) {
                $this->printJobService->queueForCompletedSession($photoSession, $user);
            }

            return $photoSession->load(['media', 'downloadAccess']);
        }

        if ($photoSession->status !== 'started') {
            throw ValidationException::withMessages([
                'photo_session' => 'Only a started session can be completed.',
            ]);
        }

        $photoSession->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $this->ensureDownloadToken($photoSession);
        if (! $printedLocally) {
            $this->printJobService->queueForCompletedSession($photoSession, $user);
        }

        return $photoSession->fresh()->load(['media', 'downloadAccess']);
    }

    private function ensureDownloadToken(PhotoSession $photoSession): DownloadToken
    {
        return DownloadToken::firstOrCreate(
            ['photo_session_id' => $photoSession->id],
            [
                'token' => $photoSession->download_token,
                'expires_at' => now()->addDays(
                    config('media.gallery_token_ttl_days', 30)
                ),
            ]
        );
    }

    private function activeDeviceForUser(
        User $user,
        string $deviceUuid
    ): Device {
        $device = Device::with('booth')
            ->where('device_uuid', $deviceUuid)
            ->where('status', 'active')
            ->first();

        if (! $device || ! $device->booth_id) {
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

        return $device;
    }

    private function ensureSessionAccess(
        PhotoSession $photoSession,
        User $user,
        string $deviceUuid
    ): void {
        $device = $this->activeDeviceForUser($user, $deviceUuid);

        if (
            $photoSession->partner_id !== $user->partner_id
            || $photoSession->operator_id !== $user->id
            || $photoSession->device_id !== $device->id
        ) {
            abort(403, 'You cannot access this photo session.');
        }
    }

    private function validateReferences(Device $device, array $data): void
    {
        if (! empty($data['event_id'])) {
            $validEvent = Event::whereKey($data['event_id'])
                ->where('partner_id', $device->partner_id)
                ->where('booth_id', $device->booth_id)
                ->exists();

            if (! $validEvent) {
                throw ValidationException::withMessages([
                    'event_id' => 'The event must belong to the device booth.',
                ]);
            }
        }

        if (! empty($data['customer_id'])) {
            $validCustomer = Customer::whereKey($data['customer_id'])
                ->where(function ($query) use ($device) {
                    $query->whereNull('partner_id')
                        ->orWhere('partner_id', $device->partner_id);
                })
                ->exists();

            if (! $validCustomer) {
                throw ValidationException::withMessages([
                    'customer_id' => 'The customer does not belong to this partner.',
                ]);
            }
        }

        if (! empty($data['payment_id'])) {
            $validPayment = Payment::whereKey($data['payment_id'])
                ->where('partner_id', $device->partner_id)
                ->where('status', 'paid')
                ->exists();

            if (! $validPayment) {
                throw ValidationException::withMessages([
                    'payment_id' => 'A paid payment belonging to this partner is required.',
                ]);
            }
        }
    }

    private function decodeDataUrl(string $dataUrl): array
    {
        if (! preg_match('/^data:([^;]+);base64,(.*)$/s', $dataUrl, $matches)) {
            throw ValidationException::withMessages([
                'data_url' => 'The data_url format is invalid.',
            ]);
        }

        $binary = base64_decode($matches[2], true);

        if ($binary === false) {
            throw ValidationException::withMessages([
                'data_url' => 'The data_url base64 payload is invalid.',
            ]);
        }

        return [$matches[1], $binary];
    }
}
