<?php

namespace App\Services;

use App\Models\Device;
use App\Models\Media;
use App\Models\PhotoSession;
use App\Models\Printer;
use App\Models\PrintJob;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PrintJobService
{
    public function __construct(protected AuditService $auditService) {}

    public function index(array $filters, User $user): LengthAwarePaginator
    {
        $query = PrintJob::query()->with('printer');
        if ($user->isSuperAdmin()) {
            if (! empty($filters['partner_id'])) {
                $query->where('partner_id', $filters['partner_id']);
            }
        } else {
            $query->where('partner_id', $user->partner_id);
        }
        foreach (['printer_id', 'photo_session_id', 'status'] as $field) {
            if (! empty($filters[$field])) {
                $query->where($field, $filters[$field]);
            }
        }

        return $query->latest()->paginate($filters['per_page'] ?? 10);
    }

    public function create(array $data, User $user): PrintJob
    {
        $session = PhotoSession::findOrFail($data['photo_session_id']);
        $printer = Printer::findOrFail($data['printer_id']);
        if (! $user->isSuperAdmin() && $session->partner_id !== $user->partner_id) {
            abort(403);
        }
        if ($session->partner_id !== $printer->partner_id) {
            throw ValidationException::withMessages(['printer_id' => 'The printer and photo session must belong to the same partner.']);
        }
        if ($session->status !== 'completed') {
            throw ValidationException::withMessages(['photo_session_id' => 'Only completed photo sessions can be printed.']);
        }
        if (! $printer->is_active) {
            throw ValidationException::withMessages(['printer_id' => 'The printer must be active.']);
        }
        if ($printer->booth_id && $printer->booth_id !== $session->booth_id) {
            throw ValidationException::withMessages(['printer_id' => 'The printer is not assigned to this session booth.']);
        }
        if ($printer->device_id && $printer->device_id !== $session->device_id) {
            throw ValidationException::withMessages(['printer_id' => 'The printer is not assigned to this session device.']);
        }
        if (! empty($data['idempotency_key'])) {
            $existing = PrintJob::where('partner_id', $session->partner_id)->where('idempotency_key', $data['idempotency_key'])->first();
            if ($existing) {
                if ($existing->photo_session_id !== $session->id || $existing->printer_id !== $printer->id || $existing->copies !== ($data['copies'] ?? 1)) {
                    throw ValidationException::withMessages(['idempotency_key' => 'The idempotency key was already used for another print job payload.']);
                }

                return $existing->load(['printer', 'photoSession.media']);
            }
        }
        try {
            $job = PrintJob::create([
                'partner_id' => $session->partner_id, 'photo_session_id' => $session->id, 'printer_id' => $printer->id,
                'printer_snapshot_id' => $session->event?->printer_snapshot_id, 'idempotency_key' => $data['idempotency_key'] ?? null,
                'copies' => $data['copies'] ?? 1, 'status' => 'queued', 'queued_at' => now(),
            ])->load(['printer', 'photoSession.media']);
        } catch (QueryException $exception) {
            $existing = ! empty($data['idempotency_key'])
                ? PrintJob::query()
                    ->where('partner_id', $session->partner_id)
                    ->where('idempotency_key', $data['idempotency_key'])
                    ->first()
                : null;

            if ($existing) {
                return $existing->load(['printer', 'photoSession.media']);
            }

            throw $exception;
        }

        $this->auditService->record('print', $user, $job, 'Print job queued.', [
            'status' => 'queued',
            'copies' => $job->copies,
            'photo_session_id' => $job->photo_session_id,
        ]);

        return $job;
    }

    public function poll(User $user, array $data)
    {
        $device = $this->activeDevice($user, $data['device_uuid']);
        $limit = $data['limit'] ?? 1;

        $this->releaseExpiredLeases($device);

        $jobs = DB::transaction(function () use ($device, $limit) {
            $jobs = PrintJob::query()
                ->where('partner_id', $device->partner_id)
                ->where('status', 'queued')
                ->whereHas('printer', fn ($query) => $query
                    ->where('is_active', true)
                    ->where('device_id', $device->id))
                ->oldest('queued_at')
                ->limit($limit)
                ->lock('FOR UPDATE SKIP LOCKED')
                ->get();

            foreach ($jobs as $job) {
                $job->update([
                    'status' => 'printing',
                    'started_at' => now(),
                    'finished_at' => null,
                    'error_log' => null,
                ]);
            }

            return $jobs->pluck('id');
        });

        $claimed = PrintJob::query()
            ->with(['printer', 'photoSession.media'])
            ->whereKey($jobs)
            ->orderBy('queued_at')
            ->get();

        foreach ($claimed as $job) {
            $this->auditService->record('print', $user, $job, 'Print job claimed by desktop.', [
                'status' => 'printing',
                'device_id' => $device->id,
            ]);
        }

        return $claimed;
    }

    public function transition(PrintJob $job, string $target, array $data = []): PrintJob
    {
        return DB::transaction(function () use ($job, $target, $data) {
            $job = PrintJob::lockForUpdate()->findOrFail($job->id);
            if ($job->status === $target) {
                return $job->load(['printer', 'photoSession.media']);
            }
            $allowed = ['queued' => ['printing', 'cancelled'], 'printing' => ['success', 'failed'], 'failed' => ['queued'], 'success' => [], 'cancelled' => []];
            if (! in_array($target, $allowed[$job->status] ?? [], true)) {
                throw ValidationException::withMessages(['status' => "Print job cannot transition from {$job->status} to {$target}."]);
            }
            if ($target === 'failed' && empty($data['error_log'])) {
                throw ValidationException::withMessages(['error_log' => 'An error log is required when printing fails.']);
            }
            $attributes = ['status' => $target];
            if ($target === 'printing') {
                $attributes['started_at'] = $job->started_at ?? now();
                $attributes['finished_at'] = null;
                $attributes['error_log'] = null;
            }
            if (in_array($target, ['success', 'failed', 'cancelled'], true)) {
                $attributes['finished_at'] = now();
                $attributes['duration_ms'] = $data['duration_ms'] ?? $job->duration_ms;
            }
            if ($target === 'failed') {
                $attributes['error_log'] = $data['error_log'];
            }
            if ($target === 'queued') {
                $attributes += ['queued_at' => now(), 'started_at' => null, 'finished_at' => null, 'duration_ms' => null, 'error_log' => null];
            }
            $job->update($attributes);

            return $job->fresh()->load(['printer', 'photoSession.media']);
        });
    }

    public function transitionForDesktop(PrintJob $job, User $user, array $data): PrintJob
    {
        $device = $this->activeDevice($user, $data['device_uuid']);
        if ($job->partner_id !== $device->partner_id || ! $job->printer || $job->printer->device_id !== $device->id || ($job->printer->booth_id && $job->printer->booth_id !== $device->booth_id)) {
            abort(403, 'The print job is not assigned to this device.');
        }

        if ($job->status === 'printing' && $data['status'] === 'printing') {
            $job->touch();

            return $job->fresh()->load(['printer', 'photoSession.media']);
        }

        $previousStatus = $job->status;
        $updated = $this->transition($job, $data['status'], $data);
        $this->auditService->record('print', $user, $updated, 'Desktop print job status updated.', [
            'from' => $previousStatus,
            'to' => $updated->status,
            'duration_ms' => $updated->duration_ms,
            'error_log' => $updated->error_log,
            'device_id' => $device->id,
        ]);

        return $updated;
    }

    public function queueForCompletedSession(PhotoSession $session, User $user): ?PrintJob
    {
        $session->loadMissing(['event.printerSnapshot', 'media']);
        $snapshot = $session->event?->printerSnapshot;

        if (! $snapshot?->auto_print || ! $this->hasPrintableMedia($session)) {
            return null;
        }

        $printer = Printer::query()
            ->where('partner_id', $session->partner_id)
            ->where('booth_id', $session->booth_id)
            ->where('device_id', $session->device_id)
            ->where('is_active', true)
            ->oldest('id')
            ->first();

        if (! $printer) {
            return null;
        }

        return $this->create([
            'photo_session_id' => $session->id,
            'printer_id' => $printer->id,
            'copies' => max(1, $snapshot->copies),
            'idempotency_key' => "session:{$session->id}",
        ], $user);
    }

    public function printableMedia(PrintJob $job, User $user, string $deviceUuid): Media
    {
        $device = $this->activeDevice($user, $deviceUuid);
        $job->loadMissing(['printer', 'photoSession.media']);

        if ($job->partner_id !== $device->partner_id || $job->printer?->device_id !== $device->id) {
            abort(403, 'The print job is not assigned to this device.');
        }

        $media = $job->photoSession?->media?->sortByDesc('id')
            ->first(fn ($item) => $item->type === 'template')
            ?? $job->photoSession?->media?->sortByDesc('id')
                ->first(fn ($item) => $item->type === 'edited');

        if (! $media) {
            abort(404, 'No printable media is available for this job.');
        }

        return $media;
    }

    private function activeDevice(User $user, string $uuid): Device
    {
        $device = Device::with('booth')->where('device_uuid', $uuid)->where('status', 'active')->first();
        if (! $device || ! $device->booth || $device->booth->status !== 'active') {
            throw ValidationException::withMessages(['device_uuid' => 'An active device assigned to an active booth is required.']);
        }
        if ($device->partner_id !== $user->partner_id) {
            abort(403, 'The device does not belong to this user.');
        }

        return $device;
    }

    private function releaseExpiredLeases(Device $device): void
    {
        $cutoff = now()->subSeconds(max(30, (int) config('printing.lease_seconds', 120)));

        $released = DB::transaction(function () use ($device, $cutoff) {
            $jobs = PrintJob::query()
                ->where('partner_id', $device->partner_id)
                ->where('status', 'printing')
                ->where('updated_at', '<=', $cutoff)
                ->whereHas('printer', fn ($query) => $query->where('device_id', $device->id))
                ->lockForUpdate()
                ->get();

            foreach ($jobs as $job) {
                $job->update([
                    'status' => 'queued',
                    'queued_at' => now(),
                    'started_at' => null,
                    'finished_at' => null,
                    'duration_ms' => null,
                    'error_log' => 'Desktop print lease expired; job returned to queue.',
                ]);
            }

            return $jobs->pluck('id');
        });

        foreach (PrintJob::query()->whereKey($released)->get() as $job) {
            $this->auditService->record('print', null, $job, 'Expired print lease returned to queue.', [
                'status' => 'queued',
                'device_id' => $device->id,
            ]);
        }
    }

    private function hasPrintableMedia(PhotoSession $session): bool
    {
        return $session->media->contains(
            fn (Media $media) => in_array($media->type, ['template', 'edited'], true)
        );
    }
}
