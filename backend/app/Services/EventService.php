<?php

namespace App\Services;

use App\Models\Booth;
use App\Models\CameraProfile;
use App\Models\Event;
use App\Models\Filter;
use App\Models\Partner;
use App\Models\PrinterProfile;
use App\Models\Template;
use App\Models\User;
use App\Services\Snapshots\SnapshotService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EventService
{
    public function __construct(
        protected SnapshotService $snapshotService,
        protected SubscriptionLimitService $subscriptionLimitService
    ) {}

    public function index(array $filters, User $user): LengthAwarePaginator
    {
        $query = Event::query()->with($this->relations());

        if (! $user->isSuperAdmin()) {
            $query->where('partner_id', $user->partner_id);
        } elseif (! empty($filters['partner_id'])) {
            $query->where('partner_id', $filters['partner_id']);
        }

        if (! empty($filters['search'])) {
            $query->where(function (Builder $query) use ($filters) {
                $query->where('event_name', 'like', "%{$filters['search']}%")
                    ->orWhere('event_code', 'like', "%{$filters['search']}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['booth_id'])) {
            $query->where('booth_id', $filters['booth_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('event_date', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('event_date', '<=', $filters['date_to']);
        }

        return $query
            ->orderBy(
                $filters['sort'] ?? 'event_date',
                $filters['direction'] ?? 'desc'
            )
            ->paginate($filters['per_page'] ?? 10);
    }

    public function show(Event $event): Event
    {
        return $event->load($this->relations());
    }

    public function store(array $data, User $user): Event
    {
        return DB::transaction(function () use ($data, $user) {
            $booth = Booth::with('partner')->findOrFail($data['booth_id']);

            if (! $user->isSuperAdmin() && $booth->partner_id !== $user->partner_id) {
                abort(403, 'You cannot create an event for this booth.');
            }

            $partner = $booth->partner;
            $this->subscriptionLimitService->ensureCanCreateEvent($partner);

            $template = $this->availableConfiguration(
                Template::query(),
                $data['template_id'],
                $partner,
                fn (Builder $query) => $query->where('status', 'published')
            );
            $filter = $this->availableConfiguration(
                Filter::query(),
                $data['filter_id'],
                $partner,
                fn (Builder $query) => $query->where('is_active', true)
            );
            $camera = $this->availableConfiguration(
                CameraProfile::query(),
                $data['camera_profile_id'],
                $partner,
                fn (Builder $query) => $query->where('is_active', true)
            );
            $printer = $this->availableConfiguration(
                PrinterProfile::query(),
                $data['printer_profile_id'],
                $partner,
                fn (Builder $query) => $query->where('is_active', true)
            );

            $snapshots = $this->snapshotService->create(
                $template,
                $filter,
                $camera,
                $printer
            );

            return Event::create([
                'partner_id' => $partner->id,
                'booth_id' => $booth->id,
                'created_by' => $user->id,
                'event_name' => $data['event_name'],
                'event_code' => $this->generateEventCode(),
                ...$snapshots,
                'event_date' => $data['event_date'],
                'start_time' => $data['start_time'],
                'end_time' => $data['end_time'],
                'price' => $data['price'] ?? 0,
                'print_count_limit' => $data['print_count_limit'] ?? 0,
                'status' => $data['status'] ?? 'draft',
            ])->load($this->relations());
        });
    }

    public function update(Event $event, array $data): Event
    {
        $event->update($data);

        return $event->fresh()->load($this->relations());
    }

    public function destroy(Event $event): void
    {
        if ($event->photoSessions()->exists()) {
            throw ValidationException::withMessages([
                'event' => 'Event cannot be deleted after photo sessions exist.',
            ]);
        }

        $event->delete();
    }

    private function availableConfiguration(
        Builder $query,
        int $id,
        Partner $partner,
        callable $activeScope
    ): Model {
        return $activeScope($query)
            ->where(function (Builder $query) use ($partner) {
                $query->whereNull('partner_id')
                    ->orWhere('partner_id', $partner->id);
            })
            ->findOrFail($id);
    }

    private function generateEventCode(): string
    {
        do {
            $code = strtoupper('EVT-'.str()->random(8));
        } while (Event::where('event_code', $code)->exists());

        return $code;
    }

    private function relations(): array
    {
        return [
            'partner',
            'booth',
            'creator',
            'templateSnapshot',
            'filterSnapshot',
            'cameraSnapshot',
            'printerSnapshot',
        ];
    }
}
