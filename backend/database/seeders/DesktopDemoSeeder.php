<?php

namespace Database\Seeders;

use App\Models\Booth;
use App\Models\CameraProfile;
use App\Models\Event;
use App\Models\Filter;
use App\Models\Partner;
use App\Models\PartnerSubscription;
use App\Models\PrinterProfile;
use App\Models\Role;
use App\Models\SubscriptionPlan;
use App\Models\Template;
use App\Models\User;
use App\Services\EventService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DesktopDemoSeeder extends Seeder
{
    public const EVENT_CODE = 'EVT-DEMO2026';

    public function run(): void
    {
        $operatorRole = Role::query()->where('slug', 'operator')->firstOrFail();

        $partner = Partner::query()->updateOrCreate(
            ['slug' => 'desktop-test-partner'],
            [
                'company_name' => 'Desktop Test Partner',
                'brand_name' => 'Desktop Test',
                'email' => 'desktop-test@example.com',
                'status' => 'active',
            ]
        );

        $plan = SubscriptionPlan::query()->updateOrCreate(
            ['name' => 'Desktop Development'],
            [
                'price' => 0,
                'billing_cycle' => 'monthly',
                'max_booths' => 2,
                'max_devices' => 4,
                'max_operators' => 5,
                'features' => ['desktop-development', 'events', 'local-media'],
                'is_active' => true,
            ]
        );

        PartnerSubscription::query()
            ->where('partner_id', $partner->id)
            ->where('status', 'active')
            ->update(['status' => 'expired']);

        PartnerSubscription::query()->updateOrCreate(
            [
                'partner_id' => $partner->id,
                'subscription_plan_id' => $plan->id,
            ],
            [
                'status' => 'active',
                'starts_at' => now()->subDay(),
                'ends_at' => now()->addYear(),
                'auto_renew' => false,
                'cancelled_at' => null,
            ]
        );

        $booth = Booth::query()->updateOrCreate(
            [
                'partner_id' => $partner->id,
                'name' => 'Desktop Test Booth',
            ],
            [
                'location' => 'Local Development',
                'status' => 'active',
            ]
        );

        $operator = User::query()->updateOrCreate(
            ['email' => 'operator@photobooth.test'],
            [
                'partner_id' => $partner->id,
                'role_id' => $operatorRole->id,
                'name' => 'Desktop Test Operator',
                'password' => Hash::make('Operator@12345'),
                'phone' => '0800000000',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        $template = Template::query()->updateOrCreate(
            [
                'partner_id' => $partner->id,
                'name' => 'Desktop Demo 4 Frame',
            ],
            [
                'preview_path' => null,
                'thumbnail_path' => null,
                'json_layout' => [
                    'layout' => 'grid',
                    'canvas' => [
                        'width' => 1200,
                        'height' => 1800,
                        'background' => '#ffffff',
                    ],
                    'frames' => [
                        ['x' => 60, 'y' => 60, 'width' => 510, 'height' => 795],
                        ['x' => 630, 'y' => 60, 'width' => 510, 'height' => 795],
                        ['x' => 60, 'y' => 945, 'width' => 510, 'height' => 795],
                        ['x' => 630, 'y' => 945, 'width' => 510, 'height' => 795],
                    ],
                ],
                'psd_path' => null,
                'png_path' => null,
                'version' => 1,
                'status' => 'published',
            ]
        );

        $filter = Filter::query()->updateOrCreate(
            [
                'partner_id' => $partner->id,
                'name' => 'Desktop Demo Natural',
            ],
            [
                'lut_path' => null,
                'brightness' => 0,
                'contrast' => 0,
                'saturation' => 0,
                'sharpness' => 0,
                'white_balance' => 0,
                'intensity' => 100,
                'version' => 1,
                'is_active' => true,
            ]
        );

        $camera = CameraProfile::query()->updateOrCreate(
            [
                'partner_id' => $partner->id,
                'name' => 'Desktop Demo Webcam',
            ],
            [
                'iso' => 'Auto',
                'shutter_speed' => 'Auto',
                'aperture' => 'Auto',
                'white_balance' => 'Auto',
                'exposure' => '0',
                'focus_mode' => 'Auto',
                'countdown_seconds' => 3,
                'burst_count' => 4,
                'image_quality' => 'PNG',
                'live_view' => true,
                'version' => 1,
                'is_active' => true,
            ]
        );

        $printer = PrinterProfile::query()->updateOrCreate(
            [
                'partner_id' => $partner->id,
                'printer_name' => 'Desktop Demo Printer',
            ],
            [
                'copies' => 1,
                'paper_size' => '4x6',
                'orientation' => 'portrait',
                'auto_print' => false,
                'border' => false,
                'bleed' => 0,
                'delay_ms' => 0,
                'version' => 1,
                'is_active' => true,
            ]
        );

        $event = Event::query()->where('event_code', self::EVENT_CODE)->first();

        if (! $event) {
            $event = app(EventService::class)->store([
                'booth_id' => $booth->id,
                'event_name' => 'Desktop Demo Event',
                'template_id' => $template->id,
                'filter_id' => $filter->id,
                'camera_profile_id' => $camera->id,
                'printer_profile_id' => $printer->id,
                'event_date' => now()->toDateString(),
                'start_time' => '00:00',
                'end_time' => '23:59',
                'price' => 0,
                'print_count_limit' => 0,
                'status' => 'scheduled',
            ], $operator);

            $event->update(['event_code' => self::EVENT_CODE]);
        } else {
            $event->update([
                'partner_id' => $partner->id,
                'booth_id' => $booth->id,
                'created_by' => $operator->id,
                'event_name' => 'Desktop Demo Event',
                'event_date' => now()->toDateString(),
                'start_time' => '00:00',
                'end_time' => '23:59',
                'price' => 0,
                'print_count_limit' => 0,
                'status' => 'scheduled',
            ]);
        }

        $device = $partner->devices()
            ->where('booth_id', $booth->id)
            ->where('status', 'active')
            ->first();

        $this->command?->info('Desktop demo data ready.');
        $this->command?->line('Email: operator@photobooth.test');
        $this->command?->line('Password: Operator@12345');
        $this->command?->line('Event code: '.self::EVENT_CODE);
        $this->command?->line('Partner ID: '.$partner->id.' | Booth ID: '.$booth->id);
        $this->command?->line('Active device UUID: '.($device?->device_uuid ?? 'belum ada; aktivasi device terlebih dahulu'));
    }
}
