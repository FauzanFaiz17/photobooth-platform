<?php

namespace App\Services;

use App\Models\Booth;
use App\Models\Event;
use App\Models\Filter;
use App\Models\Template;
use App\Models\CameraProfile;
use App\Models\PrinterProfile;
use App\Services\Snapshots\SnapshotService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EventService
{
    public function __construct(
        protected SnapshotService $snapshotService,
        protected SubscriptionLimitService $subscriptionLimitService
    ) {}

    public function index(array $filters = [])
    {
        $user = Auth::user();

        $query = Event::query()
            ->with([
                'partner',
                'booth',
                'creator',
                'templateSnapshot',
                'filterSnapshot',
                'cameraSnapshot',
                'printerSnapshot',
            ]);

        if (!$user->isSuperAdmin()) {
            $query->where('partner_id', $user->partner_id);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('event_name', 'like', "%{$filters['search']}%")
                  ->orWhere('event_code', 'like', "%{$filters['search']}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['booth_id'])) {
            $query->where('booth_id', $filters['booth_id']);
        }

        return $query->latest()->paginate(
            $filters['per_page'] ?? 10
        );
    }

    public function show(Event $event): Event
    {
        return $event->load([
            'partner',
            'booth',
            'creator',
            'templateSnapshot',
            'filterSnapshot',
            'cameraSnapshot',
            'printerSnapshot',
        ]);
    }

    public function store(array $data): Event
    {
        return DB::transaction(function () use ($data) {

            $user = Auth::user();

            $booth = Booth::findOrFail($data['booth_id']);

            if (!$user->isSuperAdmin() && $booth->partner_id !== $user->partner_id) {
                throw ValidationException::withMessages([
                    'booth_id' => ['Booth tidak valid.'],
                ]);
            }

            $this->subscriptionLimitService
                ->checkEventLimit($user->partner_id);

            $booth = $this->findBooth($data['booth_id']);

            $template = $this->findTemplate($data['template_id']);

            $filter = $this->findFilter($data['filter_id']);

            $camera = $this->findCameraProfile($data['camera_profile_id']);

            $printer = $this->findPrinterProfile($data['printer_profile_id']);

            $snapshots = $this->snapshotService->create(
                $template,
                $filter,
                $camera,
                $printer
            );

            return Event::create([
                'partner_id' => $user->partner_id,
                'booth_id' => $booth->id,
                'created_by' => $user->id,

                'event_name' => $data['event_name'],
                'event_code' => $this->generateEventCode(),

                'template_snapshot_id' => $snapshots['template_snapshot_id'],
                'filter_snapshot_id' => $snapshots['filter_snapshot_id'],
                'camera_snapshot_id' => $snapshots['camera_snapshot_id'],
                'printer_snapshot_id' => $snapshots['printer_snapshot_id'],

                'event_date' => $data['event_date'],
                'start_time' => $data['start_time'],
                'end_time' => $data['end_time'],

                'price' => $data['price'] ?? 0,
                'print_count_limit' => $data['print_count_limit'] ?? 0,

                'status' => 'draft',
            ]);
        });
    }

    public function update(Event $event, array $data): Event
    {
        $event->update([
            'event_name' => $data['event_name'],
            'event_date' => $data['event_date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'price' => $data['price'],
            'print_count_limit' => $data['print_count_limit'],
        ]);

        return $event->refresh();
    }

    public function destroy(Event $event): bool
    {
        return $event->delete();
    }

    protected function generateEventCode(): string
    {
        do {

            $code = strtoupper('EVT-' . str()->random(8));

        } while (
            Event::where('event_code', $code)->exists()
        );

        return $code;
    }


    protected function findBooth(int $id): Booth
    {
        $user = Auth::user();

        return Booth::query()
            ->when(
                !$user->isSuperAdmin(),
                fn ($query) => $query->where('partner_id', $user->partner_id)
            )
            ->findOrFail($id);
    }

    protected function findTemplate(int $id): Template
    {
        $user = Auth::user();

        return Template::query()
            ->when(
                !$user->isSuperAdmin(),
                function ($query) use ($user) {
                    $query->where(function ($q) use ($user) {
                        $q->whereNull('partner_id')
                        ->orWhere('partner_id', $user->partner_id);
                    });
                }
            )
            ->where('status', 'active')
            ->findOrFail($id);
    }

    protected function findFilter(int $id): Filter
    {
        $user = Auth::user();

        return Filter::query()
            ->when(
                !$user->isSuperAdmin(),
                function ($query) use ($user) {
                    $query->where(function ($q) use ($user) {
                        $q->whereNull('partner_id')
                        ->orWhere('partner_id', $user->partner_id);
                    });
                }
            )
            ->where('is_active', true)
            ->findOrFail($id);
    }

    protected function findCameraProfile(int $id): CameraProfile
    {
        $user = Auth::user();

        return CameraProfile::query()
            ->when(
                !$user->isSuperAdmin(),
                function ($query) use ($user) {
                    $query->where(function ($q) use ($user) {
                        $q->whereNull('partner_id')
                        ->orWhere('partner_id', $user->partner_id);
                    });
                }
            )
            ->where('is_active', true)
            ->findOrFail($id);
    }

    protected function findPrinterProfile(int $id): PrinterProfile
    {
        $user = Auth::user();

        return PrinterProfile::query()
            ->when(
                !$user->isSuperAdmin(),
                function ($query) use ($user) {
                    $query->where(function ($q) use ($user) {
                        $q->whereNull('partner_id')
                        ->orWhere('partner_id', $user->partner_id);
                    });
                }
            )
            ->where('is_active', true)
            ->findOrFail($id);
    }
}