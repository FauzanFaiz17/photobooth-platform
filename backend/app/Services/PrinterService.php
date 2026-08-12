<?php

namespace App\Services;

use App\Models\Booth;
use App\Models\Device;
use App\Models\Partner;
use App\Models\Printer;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class PrinterService
{
    public function index(array $filters, User $user): LengthAwarePaginator
    {
        $query = Printer::query()->with(['booth', 'device']);
        if ($user->isSuperAdmin()) {
            if (! empty($filters['partner_id'])) $query->where('partner_id', $filters['partner_id']);
        } else $query->where('partner_id', $user->partner_id);
        foreach (['booth_id', 'device_id'] as $field) if (! empty($filters[$field])) $query->where($field, $filters[$field]);
        if (array_key_exists('is_active', $filters)) $query->where('is_active', $filters['is_active']);
        if (! empty($filters['search'])) $query->where(fn($q) => $q->where('name','like',"%{$filters['search']}%")->orWhere('driver_name','like',"%{$filters['search']}%"));
        return $query->latest()->paginate($filters['per_page'] ?? 10);
    }

    public function create(array $data, User $user): Printer
    {
        $partnerId = $user->isSuperAdmin() ? $data['partner_id'] : $user->partner_id;
        Partner::findOrFail($partnerId);
        $this->validateAssignments($partnerId, $data['booth_id'] ?? null, $data['device_id'] ?? null);
        return Printer::create(array_merge($data, ['partner_id' => $partnerId]))->load(['booth','device']);
    }

    public function update(Printer $printer, array $data): Printer
    {
        $this->validateAssignments($printer->partner_id, $data['booth_id'] ?? null, $data['device_id'] ?? null);
        $printer->update($data);
        return $printer->fresh()->load(['booth','device']);
    }

    public function delete(Printer $printer): void
    {
        if ($printer->printJobs()->exists()) abort(409, 'A printer with print history cannot be deleted. Deactivate it instead.');
        $printer->delete();
    }

    private function validateAssignments(int $partnerId, ?int $boothId, ?int $deviceId): void
    {
        $booth = $boothId ? Booth::findOrFail($boothId) : null;
        $device = $deviceId ? Device::findOrFail($deviceId) : null;
        if ($booth && $booth->partner_id !== $partnerId) throw ValidationException::withMessages(['booth_id'=>'The booth must belong to the printer partner.']);
        if ($device && $device->partner_id !== $partnerId) throw ValidationException::withMessages(['device_id'=>'The device must belong to the printer partner.']);
        if ($device && $booth && $device->booth_id !== $booth->id) throw ValidationException::withMessages(['device_id'=>'The device must belong to the selected booth.']);
    }
}
