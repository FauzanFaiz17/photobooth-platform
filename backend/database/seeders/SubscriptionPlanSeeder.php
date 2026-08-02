<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [

            [
                'name' => 'Trial',
                'price' => 0,
                'billing_cycle' => 'monthly',
                'max_booths' => 1,
                'max_devices' => 1,
                'max_operators' => 2,
                'features' => json_encode([
                    'Dashboard',
                    '1 Booth',
                    'Basic Template'
                ]),
                'is_active' => true
            ],

            [
                'name' => 'Basic',
                'price' => 199000,
                'billing_cycle' => 'monthly',
                'max_booths' => 2,
                'max_devices' => 4,
                'max_operators' => 5,
                'features' => json_encode([
                    'Unlimited Session',
                    'QR Download',
                    'Analytics'
                ]),
                'is_active' => true
            ],

            [
                'name' => 'Professional',
                'price' => 499000,
                'billing_cycle' => 'monthly',
                'max_booths' => 10,
                'max_devices' => 20,
                'max_operators' => 30,
                'features' => json_encode([
                    'Cloud Storage',
                    'Analytics',
                    'Voucher',
                    'Event'
                ]),
                'is_active' => true
            ],

            [
                'name' => 'Enterprise',
                'price' => 999000,
                'billing_cycle' => 'monthly',
                'max_booths' => 999,
                'max_devices' => 999,
                'max_operators' => 999,
                'features' => json_encode([
                    'Unlimited',
                    'Priority Support',
                    'White Label'
                ]),
                'is_active' => true
            ]

        ];

        foreach ($plans as $plan) {

            SubscriptionPlan::updateOrCreate(

                [
                    'name' => $plan['name']
                ],

                $plan

            );

        }
    }
}