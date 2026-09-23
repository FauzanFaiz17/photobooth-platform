<?php

namespace Database\Seeders;

use App\Models\AdminDailyStat;
use App\Models\AuditLog;
use App\Models\Booth;
use App\Models\CameraProfile;
use App\Models\Customer;
use App\Models\Device;
use App\Models\DownloadToken;
use App\Models\Event;
use App\Models\Filter;
use App\Models\GalleryView;
use App\Models\Media;
use App\Models\Partner;
use App\Models\PartnerDailyStat;
use App\Models\PartnerMonthlyReport;
use App\Models\PartnerSubscription;
use App\Models\Payment;
use App\Models\PhotoSession;
use App\Models\Permission;
use App\Models\PrintJob;
use App\Models\Printer;
use App\Models\PrinterAlertLog;
use App\Models\PrinterAlertRecipient;
use App\Models\PrinterAlertSetting;
use App\Models\PrinterProfile;
use App\Models\Role;
use App\Models\SubscriptionPlan;
use App\Models\Template;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherPackage;
use App\Models\VoucherRedemption;
use App\Services\EventService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PermissionSeeder::class,
            RolePermissionSeeder::class,
            SuperAdminSeeder::class,
            SubscriptionPlanSeeder::class,
            TemplateSeeder::class,
            FilterSeeder::class,
            CameraProfileSeeder::class,
            PrinterProfileSeeder::class,
        ]);

        $this->assignPartnerRolePermissions();

        $partner = Partner::updateOrCreate(
            ['slug' => 'demo-partner'],
            [
                'company_name' => 'Demo Photobooth',
                'brand_name' => 'Demo PB',
                'address' => 'Jl. Demo No. 1, Jakarta',
                'phone' => '081111111111',
                'email' => 'demo@example.com',
                'status' => 'active',
            ]
        );

        $plan = SubscriptionPlan::where('name', 'Professional')->first()
            ?? SubscriptionPlan::where('name', 'Basic')->first()
            ?? SubscriptionPlan::first();

        PartnerSubscription::updateOrCreate(
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

        $booth = Booth::updateOrCreate(
            ['partner_id' => $partner->id, 'name' => 'Demo Booth'],
            ['location' => 'Jakarta Demo', 'status' => 'active']
        );

        $partnerOwnerRole = Role::where('slug', 'partner-owner')->firstOrFail();
        $operatorRole = Role::where('slug', 'operator')->firstOrFail();

        $owner = User::updateOrCreate(
            ['email' => 'owner@demo.test'],
            [
                'partner_id' => $partner->id,
                'role_id' => $partnerOwnerRole->id,
                'name' => 'Demo Owner',
                'password' => Hash::make('Password123!'),
                'phone' => '081111111112',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        $operator = User::updateOrCreate(
            ['email' => 'operator@demo.test'],
            [
                'partner_id' => $partner->id,
                'role_id' => $operatorRole->id,
                'name' => 'Demo Operator',
                'password' => Hash::make('Password123!'),
                'phone' => '081111111113',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        $device = Device::updateOrCreate(
            ['device_key' => 'demo-device'],
            [
                'partner_id' => $partner->id,
                'booth_id' => $booth->id,
                'device_uuid' => '11111111-1111-4111-8111-111111111111',
                'device_name' => 'Demo Device',
                'windows_uuid' => 'demo-windows-uuid',
                'cpu_identifier' => 'demo-cpu',
                'mac_address' => '00:11:22:33:44:55',
                'app_version' => '1.0.0',
                'status' => 'active',
                'activated_at' => now(),
            ]
        );

        $templatePhoto = Template::updateOrCreate(
            ['partner_id' => $partner->id, 'name' => 'Demo Photo Strip'],
            [
                'type' => 'photo',
                'paper_size' => '2r',
                'json_layout' => [
                    'layout' => 'strip',
                    'canvas' => ['width' => 600, 'height' => 1800, 'background' => '#ffffff'],
                    'frames' => [
                        ['x' => 40, 'y' => 40, 'width' => 520, 'height' => 380],
                        ['x' => 40, 'y' => 460, 'width' => 520, 'height' => 380],
                        ['x' => 40, 'y' => 880, 'width' => 520, 'height' => 380],
                    ],
                    'qr' => ['enabled' => true],
                ],
                'version' => 1,
                'status' => 'published',
            ]
        );

        $templateGif = Template::updateOrCreate(
            ['partner_id' => $partner->id, 'name' => 'Demo GIF Frame'],
            [
                'type' => 'gif',
                'paper_size' => '4r',
                'json_layout' => [
                    'layout' => 'grid',
                    'canvas' => ['width' => 1200, 'height' => 1800, 'background' => '#000000'],
                    'frames' => [
                        ['x' => 60, 'y' => 60, 'width' => 510, 'height' => 795],
                        ['x' => 630, 'y' => 60, 'width' => 510, 'height' => 795],
                    ],
                ],
                'version' => 1,
                'status' => 'published',
            ]
        );

        $filter = Filter::where('partner_id', $partner->id)->first()
            ?? Filter::where('partner_id', null)->where('is_active', true)->first()
            ?? Filter::create([
                'partner_id' => $partner->id,
                'name' => 'Demo Natural',
                'brightness' => 0,
                'contrast' => 0,
                'saturation' => 0,
                'sharpness' => 0,
                'white_balance' => 0,
                'intensity' => 100,
                'version' => 1,
                'is_active' => true,
            ]);

        $camera = CameraProfile::where('partner_id', $partner->id)->first()
            ?? CameraProfile::where('partner_id', null)->where('is_active', true)->first()
            ?? CameraProfile::create([
                'partner_id' => $partner->id,
                'name' => 'Demo Webcam',
                'iso' => 'Auto',
                'countdown_seconds' => 3,
                'burst_count' => 1,
                'image_quality' => 'JPEG',
                'live_view' => true,
                'version' => 1,
                'is_active' => true,
            ]);

        $printerProfile = PrinterProfile::where('partner_id', $partner->id)->first()
            ?? PrinterProfile::where('partner_id', null)->where('is_active', true)->first()
            ?? PrinterProfile::create([
                'partner_id' => $partner->id,
                'printer_name' => 'Demo Printer',
                'copies' => 1,
                'paper_size' => '2r',
                'orientation' => 'portrait',
                'auto_print' => false,
                'border' => false,
                'bleed' => 0,
                'delay_ms' => 0,
                'version' => 1,
                'is_active' => true,
            ]);

        $event = Event::where('event_code', 'EVT-DEMO001')->first();

        if (! $event) {
            $event = app(EventService::class)->store([
                'booth_id' => $booth->id,
                'event_name' => 'Demo Event',
                'template_id' => $templatePhoto->id,
                'template_ids' => [$templatePhoto->id],
                'filter_id' => $filter->id,
                'filter_ids' => [$filter->id],
                'camera_profile_id' => $camera->id,
                'printer_profile_id' => $printerProfile->id,
                'gif_template_id' => $templateGif->id,
                'event_date' => now()->toDateString(),
                'start_time' => '00:00',
                'end_time' => '23:59',
                'print_count_limit' => 0,
                'payment_mode' => 'full',
                'video_enabled' => true,
                'gif_enabled' => true,
                'status' => 'ongoing',
                'print_options' => [
                    ['paper_size' => '2r', 'unit_quantity' => 1, 'quantity_step' => 1, 'price' => 25000, 'discount' => null, 'is_active' => true],
                    ['paper_size' => '4r', 'unit_quantity' => 2, 'quantity_step' => 2, 'price' => 50000, 'discount' => 5000, 'is_active' => true],
                ],
            ], $owner);

            $event->update(['event_code' => 'EVT-DEMO001']);
        }

        $customer = Customer::updateOrCreate(
            ['partner_id' => $partner->id, 'phone' => '081234567890'],
            ['name' => 'Demo Customer', 'email' => 'customer@demo.test']
        );

        $voucherPackage = VoucherPackage::updateOrCreate(
            ['partner_id' => $partner->id, 'name' => 'Demo Paket 1'],
            [
                'price' => 50000,
                'persons' => 1,
                'captures' => 3,
                'print_count' => 2,
                'session_count' => 1,
                'gif_included' => false,
                'video_included' => false,
                'template_id' => $templatePhoto->id,
                'validity_days' => 30,
                'is_active' => true,
            ]
        );

        $voucher = Voucher::updateOrCreate(
            ['partner_id' => $partner->id, 'code' => 'DEMO-VOUCH-001'],
            [
                'voucher_package_id' => $voucherPackage->id,
                'status' => 'unused',
                'usage_limit' => 1,
                'usage_count' => 0,
                'expired_at' => now()->addMonth(),
                'generated_by' => $owner->id,
            ]
        );

        $payment = Payment::updateOrCreate(
            ['partner_id' => $partner->id, 'reference' => 'PAY-DEMO-001'],
            [
                'gateway' => 'cash',
                'amount' => 25000,
                'fee' => 0,
                'net_amount' => 25000,
                'status' => 'paid',
                'voucher_id' => null,
                'paid_at' => now()->subHour(),
                'gateway_response' => ['source' => 'demo-seeder'],
            ]
        );

        $printer = Printer::updateOrCreate(
            ['partner_id' => $partner->id, 'name' => 'Demo Physical Printer'],
            [
                'booth_id' => $booth->id,
                'device_id' => $device->id,
                'driver_name' => 'Microsoft Print to PDF',
                'is_active' => true,
            ]
        );

        $alertSetting = PrinterAlertSetting::updateOrCreate(
            ['printer_id' => $printer->id],
            [
                'total_print_limit' => 200,
                'low_stock_threshold' => 20,
                'is_active' => true,
            ]
        );

        PrinterAlertRecipient::updateOrCreate(
            ['alert_setting_id' => $alertSetting->id, 'email' => 'ops@demo.test'],
            ['is_active' => true]
        );

        $sessions = [];

        foreach ([1, 2] as $index) {
            $token = str_pad((string) $index, 64, 'd');
            $session = PhotoSession::updateOrCreate(
                ['download_token' => $token],
                [
                    'partner_id' => $partner->id,
                    'booth_id' => $booth->id,
                    'event_id' => $event->id,
                    'device_id' => $device->id,
                    'operator_id' => $operator->id,
                    'customer_id' => $index === 1 ? $customer->id : null,
                    'payment_id' => $index === 1 ? $payment->id : null,
                    'folder_slug' => 'name-demo-customer-'.$index,
                    'status' => 'completed',
                    'started_at' => now()->subHours(3 - $index),
                    'completed_at' => now()->subHours(2 - $index),
                ]
            );
            $sessions[] = $session;

            DownloadToken::updateOrCreate(
                ['photo_session_id' => $session->id],
                [
                    'token' => $token,
                    'download_count' => $index === 1 ? 2 : 0,
                    'share_count' => 1,
                    'expires_at' => now()->addDays(30),
                    'last_download_at' => $index === 1 ? now()->subDay() : null,
                ]
            );

            GalleryView::firstOrCreate(
                [
                    'photo_session_id' => $session->id,
                    'ip_address' => '127.0.0.1',
                ],
                [
                    'user_agent' => 'DemoBrowser/1.0',
                    'viewed_at' => now()->subHour(),
                ]
            );

            $this->seedSessionMedia($session, $index);
        }

        PrintJob::updateOrCreate(
            [
                'partner_id' => $partner->id,
                'photo_session_id' => $sessions[0]->id,
                'printer_id' => $printer->id,
                'idempotency_key' => 'demo-print-job-001',
            ],
            [
                'printer_snapshot_id' => $event->printer_snapshot_id,
                'copies' => 1,
                'status' => 'success',
                'duration_ms' => 4200,
                'queued_at' => now()->subMinutes(90),
                'started_at' => now()->subMinutes(90),
                'finished_at' => now()->subMinutes(89),
            ]
        );

        PrintJob::updateOrCreate(
            [
                'partner_id' => $partner->id,
                'photo_session_id' => $sessions[1]->id,
                'printer_id' => $printer->id,
                'idempotency_key' => 'demo-print-job-002',
            ],
            [
                'printer_snapshot_id' => $event->printer_snapshot_id,
                'copies' => 1,
                'status' => 'queued',
                'queued_at' => now(),
            ]
        );

        PrinterAlertLog::firstOrCreate(
            [
                'alert_setting_id' => $alertSetting->id,
                'recipient_email' => 'ops@demo.test',
                'sent_at' => now()->subDay(),
            ],
            [
                'remaining_prints' => 18,
                'channel' => 'email',
            ]
        );

        PartnerDailyStat::updateOrCreate(
            ['partner_id' => $partner->id, 'stat_date' => now()->toDateString()],
            [
                'total_revenue' => 75000,
                'total_sessions' => 2,
                'total_customers' => 1,
                'total_prints' => 1,
                'total_downloads' => 2,
            ]
        );

        PartnerMonthlyReport::updateOrCreate(
            [
                'partner_id' => $partner->id,
                'period_year' => (int) now()->format('Y'),
                'period_month' => (int) now()->format('n'),
            ],
            [
                'total_revenue' => 75000,
                'total_sessions' => 2,
                'total_customers' => 1,
                'total_vouchers_used' => 0,
                'total_qris_transactions' => 0,
                'total_prints' => 1,
                'total_downloads' => 2,
                'total_media' => 4,
                'generated_at' => now(),
            ]
        );

        AdminDailyStat::updateOrCreate(
            ['stat_date' => now()->toDateString()],
            [
                'total_partners' => Partner::count(),
                'total_booths' => Booth::count(),
                'total_devices' => Device::count(),
                'total_events' => Event::count(),
                'total_sessions' => PhotoSession::count(),
                'total_payments' => Payment::count(),
                'total_media' => Media::count(),
                'total_print_jobs' => PrintJob::count(),
                'total_uploads' => 0,
                'total_downloads' => 2,
                'created_at' => now(),
            ]
        );

        AuditLog::firstOrCreate(
            [
                'partner_id' => $partner->id,
                'user_id' => $owner->id,
                'action' => 'login',
                'description' => 'Demo login seeded',
            ],
            [
                'subject_type' => User::class,
                'subject_id' => $owner->id,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'DemoSeeder',
                'metadata' => ['source' => 'DemoDataSeeder'],
                'created_at' => now(),
            ]
        );

        VoucherRedemption::firstOrCreate(
            [
                'voucher_id' => $voucher->id,
                'usage_number' => 1,
            ],
            [
                'payment_id' => $payment->id,
                'redeemed_by' => $operator->id,
                'redeemed_at' => now()->subHour(),
            ]
        );

        $this->command?->info('Demo data seeded.');
        $this->command?->line('Super admin: superadmin@photobooth.com / Admin@12345');
        $this->command?->line('Owner: owner@demo.test / Password123!');
        $this->command?->line('Operator: operator@demo.test / Password123!');
        $this->command?->line('Event: EVT-DEMO001 | Device UUID: '.$device->device_uuid);
    }

    private function assignPartnerRolePermissions(): void
    {
        $permissionIds = Permission::pluck('id');

        foreach (['partner-owner', 'partner-manager', 'operator'] as $slug) {
            Role::where('slug', $slug)->first()?->permissions()->sync($permissionIds);
        }
    }

    private function seedSessionMedia(PhotoSession $session, int $index): void
    {
        $samples = [
            ['shared/sample/2r.png', 'image/png'],
            ['shared/sample/4r.png', 'image/png'],
        ];

        foreach ($samples as $offset => [$relative, $mime]) {
            $objectKey = sprintf('sessions/demo/%d/photo-%d.png', $index, $offset + 1);
            $absolute = base_path('../'.$relative);

            if (File::exists($absolute)) {
                $dir = storage_path('app/'.dirname($objectKey));
                File::ensureDirectoryExists($dir);
                File::copy($absolute, storage_path('app/'.$objectKey));
            }

            Media::updateOrCreate(
                [
                    'photo_session_id' => $session->id,
                    'object_key' => $objectKey,
                ],
                [
                    'type' => 'original',
                    'bucket' => 'local',
                    'filename' => basename($objectKey),
                    'mime_type' => $mime,
                    'size_bytes' => File::exists(storage_path('app/'.$objectKey))
                        ? (int) File::size(storage_path('app/'.$objectKey))
                        : 1024,
                    'checksum' => hash('sha256', $objectKey.$index.$offset),
                    'width' => 600,
                    'height' => 900,
                    'visibility' => 'private',
                ]
            );
        }
    }
}
