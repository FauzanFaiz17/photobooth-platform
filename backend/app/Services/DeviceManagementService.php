<?php

namespace App\Services;

use App\Models\Booth;
use App\Models\Device;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DeviceManagementService
{
    private const ACTIVATION_MINUTES = 30;

    public function __construct(
        protected SubscriptionLimitService $limitService
    ) {}

    public function index(array $filters, User $authUser): LengthAwarePaginator
    {
        $query = Device::query()->with(['partner', 'booth']);

        if (! $authUser->isSuperAdmin()) {
            $query->where('partner_id', $authUser->partner_id);
        } elseif (! empty($filters['partner_id'])) {
            $query->where('partner_id', $filters['partner_id']);
        }

        if (! empty($filters['booth_id'])) {
            $query->where('booth_id', $filters['booth_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($nested) use ($search) {
                $nested->where('device_name', 'like', "%{$search}%")
                    ->orWhere('device_key', 'like', "%{$search}%")
                    ->orWhere('device_uuid', 'like', "%{$search}%");
            });
        }

        return $query
            ->orderBy($filters['sort'] ?? 'created_at', $filters['direction'] ?? 'desc')
            ->paginate($filters['per_page'] ?? 10);
    }

    public function create(array $data, User $authUser): array
    {
        $partner = $authUser->isSuperAdmin()
            ? Partner::findOrFail($data['partner_id'])
            : $authUser->partner;

        if (! $partner) {
            throw ValidationException::withMessages([
                'partner_id' => 'A partner account is required.',
            ]);
        }

        $booth = Booth::findOrFail($data['booth_id']);

        return $this->issueActivation($partner, $booth, $data['device_name']);
    }

    public function issueActivation(Partner $partner, Booth $booth, string $deviceName): array
    {
        return DB::transaction(function () use ($partner, $booth, $deviceName) {
            $this->ensureBoothBelongsToPartner($booth, $partner);
            $this->ensureBoothIsActive($booth);
            $this->limitService->ensureCanCreateDevice($partner);

            [$code, $hash] = $this->newActivationCode();

            $device = Device::create([
                'partner_id' => $partner->id,
                'booth_id' => $booth->id,
                'device_key' => 'DEV-'.Str::upper(Str::random(12)),
                'device_name' => $deviceName,
                'device_uuid' => null,
                'activation_code_hash' => $hash,
                'activation_expires_at' => now()->addMinutes(self::ACTIVATION_MINUTES),
                'status' => 'pending',
            ]);

            return [$device->load(['partner', 'booth']), $code];
        });
    }

    public function update(Device $device, array $data): Device
    {
        $booth = Booth::findOrFail($data['booth_id']);
        $this->ensureBoothBelongsToPartner($booth, $device->partner);
        $this->ensureBoothIsActive($booth);

        if ($device->status === 'pending' && $data['status'] === 'active') {
            throw ValidationException::withMessages([
                'status' => 'A pending device must be activated from the desktop application.',
            ]);
        }

        $device->update([
            'booth_id' => $booth->id,
            'device_name' => $data['device_name'],
            'status' => $data['status'],
        ]);

        return $device->fresh()->load(['partner', 'booth']);
    }

    public function regenerateActivation(Device $device): array
    {
        return DB::transaction(function () use ($device) {
            $this->limitService->ensureSubscriptionIsActive($device->partner);
            $this->ensureBoothIsActive($device->booth);
            [$code, $hash] = $this->newActivationCode();

            $device->update([
                'device_uuid' => null,
                'windows_uuid' => null,
                'cpu_identifier' => null,
                'mac_address' => null,
                'app_version' => null,
                'activation_code_hash' => $hash,
                'activation_expires_at' => now()->addMinutes(self::ACTIVATION_MINUTES),
                'activated_at' => null,
                'status' => 'pending',
            ]);

            return [$device->fresh()->load(['partner', 'booth']), $code];
        });
    }

    public function delete(Device $device): void
    {
        $device->delete();
    }

    private function newActivationCode(): array
    {
        $code = 'PB-'.Str::upper(Str::random(4)).'-'.Str::upper(Str::random(4));

        return [$code, hash('sha256', $this->normalizeActivationCode($code))];
    }

    private function normalizeActivationCode(string $code): string
    {
        return Str::upper(trim($code));
    }

    private function ensureBoothBelongsToPartner(Booth $booth, Partner $partner): void
    {
        if ($booth->partner_id !== $partner->id) {
            throw ValidationException::withMessages([
                'booth_id' => 'The booth does not belong to this partner.',
            ]);
        }
    }

    private function ensureBoothIsActive(?Booth $booth): void
    {
        if (! $booth || $booth->status !== 'active') {
            throw ValidationException::withMessages([
                'booth_id' => 'The booth must be active.',
            ]);
        }
    }
}
