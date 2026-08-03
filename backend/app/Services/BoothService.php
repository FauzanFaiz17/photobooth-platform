<?php

namespace App\Services;

use App\Models\Booth;
use App\Models\User;
use App\Models\Partner;
use Illuminate\Support\Facades\DB;

class BoothService
{
    public function __construct(
        protected SubscriptionLimitService $limitService
    ) {}

    public function index(array $filters, User $authUser)
    {
        $query = Booth::query()
            ->with('partner')
            ->withCount('devices');

        /*
        * Multi Tenant
        */
        if (!$authUser->isSuperAdmin()) {

            $query->where(
                'partner_id',
                $authUser->partner_id
            );

        }

        /*
        * Search
        */
        if (!empty($filters['search'])) {

            $query->where(
                'name',
                'like',
                "%{$filters['search']}%"
            );

        }

        /*
        * Status
        */
        if (!empty($filters['status'])) {

            $query->where(
                'status',
                $filters['status']
            );

        }

        /*
        * Filter Partner (Super Admin only)
        */
        if (
            $authUser->isSuperAdmin()
            &&
            !empty($filters['partner'])
        ) {

            $query->where(
                'partner_id',
                $filters['partner']
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

    public function show(Booth $booth): Booth
    {
        return $booth
            ->load([
                'partner',
                'devices'
            ]);
    }

    public function store(
        array $data,
        User $authUser
    ): Booth
    {
        return DB::transaction(function () use ($data, $authUser) {

            /*
            * Tentukan partner.
            * Super Admin boleh memilih partner,
            * selain itu selalu menggunakan partner miliknya.
            */
            $partner = $authUser->isSuperAdmin()
                ? Partner::findOrFail($data['partner_id'])
                : $authUser->partner;

            /*
            * Cek limit subscription.
            */
            $this->limitService
                ->ensureCanCreateBooth($partner);

            /*
            * Paksa partner_id untuk user non Super Admin.
            */
            $data['partner_id'] = $partner->id;

            /*
            * Status default.
            */
            $data['status'] = $data['status'] ?? 'active';

            return Booth::create($data)
                ->load('partner');
        });
    }

    public function update(
        Booth $booth,
        array $data,
        User $authUser
    ): Booth
    {
        return DB::transaction(function () use ($booth, $data, $authUser) {

            /*
            * Hanya Super Admin yang boleh memindahkan
            * booth ke partner lain.
            */
            if (
                !$authUser->isSuperAdmin()
                &&
                isset($data['partner_id'])
            ) {

                unset($data['partner_id']);

            }

            $booth->update($data);

            return $booth
                ->fresh()
                ->load('partner');
        });
    }

    public function destroy(
        Booth $booth
    ): void
    {
        DB::transaction(function () use ($booth) {

            if ($booth->devices()->exists()) {

                abort(
                    422,
                    'Booth still has registered devices.'
                );

            }

            $booth->delete();

        });
    }
}