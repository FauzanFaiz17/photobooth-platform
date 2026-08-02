<?php

namespace App\Services;

use App\Models\Partner;
use App\Models\SubscriptionPlan;
use App\Models\PartnerSubscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;


class PartnerService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function index(array $filters)
    {
        $query = Partner::query()
            ->with([
                'activeSubscription.subscriptionPlan'
            ]);

        if (!empty($filters['search'])) {

            $query->where(function ($q) use ($filters) {

                $q->where(
                    'company_name',
                    'like',
                    "%{$filters['search']}%"
                )

                ->orWhere(
                    'brand_name',
                    'like',
                    "%{$filters['search']}%"
                );

            });

        }

        if (!empty($filters['status'])) {

            $query->where(
                'status',
                $filters['status']
            );

        }

        return $query
            ->orderBy(
                $filters['sort'] ?? 'created_at',
                $filters['direction'] ?? 'desc'
            )
            ->paginate(
                $filters['per_page'] ?? 10
            );
    }

    /**
     * Detail Partner
     */
    public function show(Partner $partner)
    {
        return $partner->load([
            'activeSubscription.subscriptionPlan'
        ]);
    }

    public function store(array $data): Partner
    {
        return DB::transaction(function () use ($data) {

            $data['slug'] = $this->generateSlug(
                $data['company_name']
            );

            $data['status'] = $data['status'] ?? 'trial';

            $partner = Partner::create($data);

            $trialPlan = SubscriptionPlan::where(
                'name',
                'Trial'
            )->firstOrFail();

            PartnerSubscription::create([

                'partner_id' => $partner->id,

                'subscription_plan_id' => $trialPlan->id,

                'status' => 'active',

                'starts_at' => now(),

                'ends_at' => now()->addDays(30),

                'auto_renew' => false

            ]);

            return $partner->load([
                'activeSubscription.subscriptionPlan'
            ]);

        });
    }

    public function update(
        Partner $partner,
        array $data
    ): Partner
    {

        return DB::transaction(function () use ($partner, $data) {

            if (
                $partner->company_name
                !=
                $data['company_name']
            ) {

                $data['slug'] = $this->generateSlug(
                    $data['company_name'],
                    $partner->id
                );

            }

            $partner->update($data);

            return $partner->fresh()->load([
                'activeSubscription.subscriptionPlan'
            ]);

        });

    }

    protected function generateSlug(
        string $companyName,
        ?int $ignoreId = null
    ): string
    {

        $slug = Str::slug($companyName);

        $original = $slug;

        $counter = 1;

        while (

            Partner::where('slug', $slug)

                ->when(
                    $ignoreId,
                    fn ($q) => $q->where('id', '!=', $ignoreId)
                )

                ->exists()

        ) {

            $counter++;

            $slug = $original.'-'.$counter;

        }

        return $slug;

    }

    public function destroy(Partner $partner): void
    {
        DB::transaction(function () use ($partner) {

            if ($partner->users()->exists()) {
                abort(422, 'Partner still has users.');
            }

            // if ($partner->booths()->exists()) {
            //     abort(422, 'Partner still has booths.');
            // }

            $partner->delete();
        });
    }
}
