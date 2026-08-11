<?php

use App\Models\Booth;
use App\Models\Device;
use App\Models\Partner;
use App\Services\DeviceManagementService;
use App\Services\PartnerSubscriptionService;
use App\Services\PaymentService;
use App\Services\VoucherService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command(
    'device:issue-activation {partner : Partner ID or slug} {booth : Booth ID} {name : Device name}',
    function (string $partner, int $booth, string $name) {
        $partnerModel = is_numeric($partner)
            ? Partner::query()->findOrFail((int) $partner)
            : Partner::query()->where('slug', $partner)->firstOrFail();

        $boothModel = Booth::query()->findOrFail($booth);

        [$device, $activationCode] = app(DeviceManagementService::class)
            ->issueActivation($partnerModel, $boothModel, $name);

        $this->info('Pending device berhasil dibuat.');
        $this->table(
            ['Device ID', 'Partner', 'Booth', 'Nama', 'Berlaku sampai'],
            [[
                $device->id,
                $partnerModel->company_name,
                $boothModel->name,
                $device->device_name,
                $device->activation_expires_at?->toDateTimeString(),
            ]]
        );
        $this->warn('Activation code: '.$activationCode);
        $this->line('Masukkan kode ini pada halaman aktivasi Electron dalam 30 menit.');
    }
)->purpose('Issue a production-style desktop device activation code');

Artisan::command(
    'device:regenerate-activation {device : Device ID}',
    function (int $device) {
        $deviceModel = Device::query()->with(['partner', 'booth'])->findOrFail($device);

        [$updatedDevice, $activationCode] = app(DeviceManagementService::class)
            ->regenerateActivation($deviceModel);

        $this->info('Device dikembalikan ke status pending.');
        $this->table(
            ['Device ID', 'Partner', 'Booth', 'Nama', 'Berlaku sampai'],
            [[
                $updatedDevice->id,
                $updatedDevice->partner?->company_name,
                $updatedDevice->booth?->name,
                $updatedDevice->device_name,
                $updatedDevice->activation_expires_at?->toDateTimeString(),
            ]]
        );
        $this->warn('Activation code: '.$activationCode);
        $this->line('Restart Electron lalu masukkan kode ini dalam 30 menit.');
    }
)->purpose('Regenerate a production-style activation code for an existing device');

Artisan::command('subscriptions:expire', function () {
    $count = app(PartnerSubscriptionService::class)->expireDue();
    $this->info("{$count} subscription(s) expired.");
})->purpose('Mark active partner subscriptions past their end date as expired');

Artisan::command('vouchers:expire', function () {
    $count = app(VoucherService::class)->expireDue();
    $this->info("{$count} voucher(s) expired.");
})->purpose('Mark unused vouchers past their expiration date as expired');

Artisan::command('payments:expire', function () {
    $count = app(PaymentService::class)->expireDue();
    $this->info("{$count} payment(s) expired.");
})->purpose('Mark pending payments past their expiration date as expired');
