<?php

namespace App\Services;

use App\Models\Device;
use App\Models\Media;
use App\Models\PhotoSession;
use App\Models\Printer;
use App\Models\PrintJob;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PrintJobService
{
    public function index(array $filters, User $user): LengthAwarePaginator
    {
        $query = PrintJob::query()->with('printer');
        if ($user->isSuperAdmin()) { if (!empty($filters['partner_id'])) $query->where('partner_id',$filters['partner_id']); }
        else $query->where('partner_id',$user->partner_id);
        foreach (['printer_id','photo_session_id','status'] as $field) if (!empty($filters[$field])) $query->where($field,$filters[$field]);
        return $query->latest()->paginate($filters['per_page'] ?? 10);
    }

    public function create(array $data, User $user): PrintJob
    {
        $session = PhotoSession::findOrFail($data['photo_session_id']);
        $printer = Printer::findOrFail($data['printer_id']);
        if (!$user->isSuperAdmin() && $session->partner_id !== $user->partner_id) abort(403);
        if ($session->partner_id !== $printer->partner_id) throw ValidationException::withMessages(['printer_id'=>'The printer and photo session must belong to the same partner.']);
        if ($session->status !== 'completed') throw ValidationException::withMessages(['photo_session_id'=>'Only completed photo sessions can be printed.']);
        if (!$printer->is_active) throw ValidationException::withMessages(['printer_id'=>'The printer must be active.']);
        if ($printer->booth_id && $printer->booth_id !== $session->booth_id) throw ValidationException::withMessages(['printer_id'=>'The printer is not assigned to this session booth.']);
        if ($printer->device_id && $printer->device_id !== $session->device_id) throw ValidationException::withMessages(['printer_id'=>'The printer is not assigned to this session device.']);
        if (!empty($data['idempotency_key'])) {
            $existing=PrintJob::where('partner_id',$session->partner_id)->where('idempotency_key',$data['idempotency_key'])->first();
            if ($existing) {
                if ($existing->photo_session_id !== $session->id || $existing->printer_id !== $printer->id || $existing->copies !== ($data['copies'] ?? 1)) throw ValidationException::withMessages(['idempotency_key'=>'The idempotency key was already used for another print job payload.']);
                return $existing->load(['printer', 'photoSession.media']);
            }
        }
        return PrintJob::create([
            'partner_id'=>$session->partner_id,'photo_session_id'=>$session->id,'printer_id'=>$printer->id,
            'printer_snapshot_id'=>$session->event?->printer_snapshot_id,'idempotency_key'=>$data['idempotency_key'] ?? null,
            'copies'=>$data['copies'] ?? 1,'status'=>'queued','queued_at'=>now(),
        ])->load(['printer', 'photoSession.media']);
    }

    public function poll(User $user, array $data)
    {
        $device=$this->activeDevice($user,$data['device_uuid']);
        return PrintJob::query()->with(['printer', 'photoSession.media'])
            ->where('partner_id',$device->partner_id)->where('status','queued')
            ->whereHas('printer', fn($q)=>$q->where('is_active',true)->where('device_id',$device->id))
            ->oldest('queued_at')->limit($data['limit'] ?? 10)->get();
    }

    public function transition(PrintJob $job, string $target, array $data = []): PrintJob
    {
        return DB::transaction(function() use($job,$target,$data) {
            $job=PrintJob::lockForUpdate()->findOrFail($job->id);
            if ($job->status === $target) return $job->load(['printer', 'photoSession.media']);
            $allowed=['queued'=>['printing','cancelled'],'printing'=>['success','failed'],'failed'=>['queued'],'success'=>[],'cancelled'=>[]];
            if (!in_array($target,$allowed[$job->status] ?? [],true)) throw ValidationException::withMessages(['status'=>"Print job cannot transition from {$job->status} to {$target}."]);
            if ($target === 'failed' && empty($data['error_log'])) throw ValidationException::withMessages(['error_log'=>'An error log is required when printing fails.']);
            $attributes=['status'=>$target];
            if ($target==='printing') { $attributes['started_at']=$job->started_at ?? now(); $attributes['finished_at']=null; $attributes['error_log']=null; }
            if (in_array($target,['success','failed','cancelled'],true)) { $attributes['finished_at']=now(); $attributes['duration_ms']=$data['duration_ms'] ?? $job->duration_ms; }
            if ($target==='failed') $attributes['error_log']=$data['error_log'];
            if ($target==='queued') { $attributes += ['queued_at'=>now(),'started_at'=>null,'finished_at'=>null,'duration_ms'=>null,'error_log'=>null]; }
            $job->update($attributes); return $job->fresh()->load(['printer', 'photoSession.media']);
        });
    }

    public function transitionForDesktop(PrintJob $job, User $user, array $data): PrintJob
    {
        $device=$this->activeDevice($user,$data['device_uuid']);
        if ($job->partner_id !== $device->partner_id || !$job->printer || $job->printer->device_id !== $device->id || ($job->printer->booth_id && $job->printer->booth_id !== $device->booth_id)) abort(403,'The print job is not assigned to this device.');
        return $this->transition($job,$data['status'],$data);
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
        $device=Device::with('booth')->where('device_uuid',$uuid)->where('status','active')->first();
        if (!$device || !$device->booth || $device->booth->status !== 'active') throw ValidationException::withMessages(['device_uuid'=>'An active device assigned to an active booth is required.']);
        if ($device->partner_id !== $user->partner_id) abort(403,'The device does not belong to this user.');
        return $device;
    }
}
