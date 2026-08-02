<?php

namespace Database\Seeders;

use App\Models\Partner;
use App\Models\SubscriptionPlan;
use App\Models\PartnerSubscription;
use Illuminate\Database\Seeder;

class PartnerSubscriptionSeeder extends Seeder
{
    public function run(): void
    {
        $trial = SubscriptionPlan::where(
            'name',
            'Trial'
        )->first();

        foreach (Partner::all() as $partner) {

            PartnerSubscription::updateOrCreate(

                [

                    'partner_id' => $partner->id,

                    'subscription_plan_id' => $trial->id

                ],

                [

                    'status' => 'active',

                    'starts_at' => now(),

                    'ends_at' => now()->addDays(30),

                    'auto_renew' => false

                ]

            );

        }
    }
}