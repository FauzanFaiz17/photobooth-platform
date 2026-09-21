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
            $templateIds = array_values(array_unique($data['template_ids'] ?? [$data['template_id']]));
            $filterIds = array_values(array_unique($data['filter_ids'] ?? [$data['filter_id']]));
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

            $gifSnapshotId = null;
            if (! empty($data['gif_template_id'])) {
                $gifTemplate = $this->availableConfiguration(
                    Template::query(),
                    $data['gif_template_id'],
                    $partner,
                    fn (Builder $query) => $query->where('status', 'published')->where('type', 'gif')
                );
                $gifSnapshotId = $this->snapshotService->createTemplate($gifTemplate);
            }

            $event = Event::create([
                'partner_id' => $partner->id,
                'booth_id' => $booth->id,
                'created_by' => $user->id,
                'event_name' => $data['event_name'],
                'event_code' => $this->generateEventCode(),
                ...$snapshots,
                'gif_template_snapshot_id' => $gifSnapshotId,
                'event_date' => $data['event_date'],
                'start_time' => $data['start_time'],
                'end_time' => $data['end_time'],
                'print_count_limit' => $data['print_count_limit'] ?? 0,
                'payment_mode' => $data['payment_mode'] ?? 'full',
                'video_enabled' => $data['video_enabled'] ?? true,
                'gif_enabled' => $data['gif_enabled'] ?? true,
                'status' => $data['status'] ?? 'draft',
            ]);

            foreach ($templateIds as $order => $templateId) {
                $item = $this->availableConfiguration(Template::query(), $templateId, $partner, fn (Builder $q) => $q->where('status', 'published'));
                $snapshotId = $order === 0 ? $snapshots['template_snapshot_id'] : $this->snapshotService->createTemplate($item);
                $event->templateSnapshots()->attach($snapshotId, ['sort_order' => $order, 'is_default' => $order === 0]);
            }
            foreach ($filterIds as $order => $filterId) {
                $item = $this->availableConfiguration(Filter::query(), $filterId, $partner, fn (Builder $q) => $q->where('is_active', true));
                $snapshotId = $order === 0 ? $snapshots['filter_snapshot_id'] : $this->snapshotService->createFilter($item);
                $event->filterSnapshots()->attach($snapshotId, ['sort_order' => $order, 'is_default' => $order === 0]);
            }
            foreach ($data['print_options'] ?? [] as $option) {
                $event->printOptions()->create($option);
            }

            return $event->load($this->relations());
        });
    }

    public function update(Event $event, array $data): Event
    {
        $templateIds = $data['template_ids'] ?? null;
        unset($data['template_ids']);

        $filterIds = $data['filter_ids'] ?? null;
        unset($data['filter_ids']);

        $gifTemplateId = $data['gif_template_id'] ?? null;
        $hasGifTemplateKey = array_key_exists('gif_template_id', $data);
        unset($data['gif_template_id']);

        $printOptions = $data['print_options'] ?? null;
        unset($data['print_options']);

        $event->update($data);

        if ($templateIds !== null) {
            $this->syncEventTemplates($event, $templateIds);
        }

        if ($filterIds !== null) {
            $this->syncEventFilters($event, $filterIds);
        }

        if ($hasGifTemplateKey) {
            $this->syncGifTemplate($event, $gifTemplateId);
        }

        if ($printOptions !== null) {
            $this->syncPrintOptions($event, $printOptions);
        }

        return $event->fresh()->load($this->relations());
    }

    private function syncEventTemplates(Event $event, array $templateIds): void
    {
        $templateIds = array_values(array_unique($templateIds));

        if (empty($templateIds)) {
            throw ValidationException::withMessages([
                'template_ids' => 'At least one template is required.',
            ]);
        }

        $partner = $event->partner;

        $newSnapshots = [];
        foreach ($templateIds as $order => $templateId) {
            $template = $this->availableConfiguration(
                Template::query(),
                $templateId,
                $partner,
                fn (Builder $q) => $q->where('status', 'published')
            );
            $snapshotId = $this->snapshotService->createTemplate($template);
            $newSnapshots[] = ['snapshot_id' => $snapshotId, 'order' => $order];
        }

        $event->templateSnapshots()->detach();

        foreach ($newSnapshots as $item) {
            $event->templateSnapshots()->attach($item['snapshot_id'], [
                'sort_order' => $item['order'],
                'is_default' => $item['order'] === 0,
            ]);
        }

        $firstSnapshotId = $newSnapshots[0]['snapshot_id'];
        if ($event->template_snapshot_id !== $firstSnapshotId) {
            $event->update(['template_snapshot_id' => $firstSnapshotId]);
        }
    }

    private function syncEventFilters(Event $event, array $filterIds): void
    {
        $filterIds = array_values(array_unique($filterIds));

        if (empty($filterIds)) {
            throw ValidationException::withMessages([
                'filter_ids' => 'At least one filter is required.',
            ]);
        }

        $partner = $event->partner;

        $newSnapshots = [];
        foreach ($filterIds as $order => $filterId) {
            $filter = $this->availableConfiguration(
                Filter::query(),
                $filterId,
                $partner,
                fn (Builder $q) => $q->where('is_active', true)
            );
            $snapshotId = $this->snapshotService->createFilter($filter);
            $newSnapshots[] = ['snapshot_id' => $snapshotId, 'order' => $order];
        }

        $event->filterSnapshots()->detach();

        foreach ($newSnapshots as $item) {
            $event->filterSnapshots()->attach($item['snapshot_id'], [
                'sort_order' => $item['order'],
                'is_default' => $item['order'] === 0,
            ]);
        }

        $firstSnapshotId = $newSnapshots[0]['snapshot_id'];
        if ($event->filter_snapshot_id !== $firstSnapshotId) {
            $event->update(['filter_snapshot_id' => $firstSnapshotId]);
        }
    }

    private function syncGifTemplate(Event $event, ?int $gifTemplateId): void
    {
        if ($gifTemplateId === null) {
            $event->update(['gif_template_snapshot_id' => null]);
            return;
        }

        $partner = $event->partner;
        $gifTemplate = $this->availableConfiguration(
            Template::query(),
            $gifTemplateId,
            $partner,
            fn (Builder $q) => $q->where('status', 'published')->where('type', 'gif')
        );
        $gifSnapshotId = $this->snapshotService->createTemplate($gifTemplate);
        $event->update(['gif_template_snapshot_id' => $gifSnapshotId]);
    }

    private function syncPrintOptions(Event $event, array $printOptions): void
    {
        $event->printOptions()->delete();

        foreach ($printOptions as $option) {
            $event->printOptions()->create($option);
        }
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
            'gifTemplateSnapshot',
            'templateSnapshots',
            'filterSnapshots',
            'printOptions',
        ];
    }
}
