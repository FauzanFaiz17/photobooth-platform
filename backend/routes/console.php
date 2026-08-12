<?php

use App\Jobs\AggregateAdminDailyStats;
use App\Jobs\AggregatePartnerDailyStats;
use App\Jobs\AggregatePartnerMonthlyReports;
use App\Models\Booth;
use App\Models\Device;
use App\Models\Partner;
use App\Services\DeviceManagementService;
use App\Services\PartnerSubscriptionService;
use App\Services\PaymentService;
use App\Services\VoucherService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

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

Artisan::command('media:storage-check', function () {
    $disk = config('media.disk', 'local');
    $filesystem = config("filesystems.disks.{$disk}", []);
    $required = ($filesystem['driver'] ?? null) === 's3'
        ? ['key', 'secret', 'bucket', 'endpoint']
        : [];
    $missing = collect($required)
        ->filter(fn (string $key) => blank($filesystem[$key] ?? null))
        ->values();

    $this->table([
        'Setting',
        'Value',
    ], [
        ['MEDIA_DISK', $disk],
        ['Driver', $filesystem['driver'] ?? 'unknown'],
        ['Bucket', filled($filesystem['bucket'] ?? null) ? 'configured' : 'missing'],
        ['Endpoint', filled($filesystem['endpoint'] ?? null) ? 'configured' : 'missing'],
        ['Credentials', $missing->isEmpty() ? 'configured' : 'missing'],
    ]);

    if ($missing->isNotEmpty()) {
        $this->warn('Missing storage configuration: '.$missing->implode(', '));

        return 1;
    }

    if ($disk === 'local') {
        $this->info('Local media storage is ready.');

        return 0;
    }

    try {
        Storage::disk($disk)->exists('__photobooth_storage_check__');
        $this->info("Storage disk [{$disk}] is reachable.");
    } catch (Throwable $exception) {
        $this->error('Storage check failed: '.$exception->getMessage());

        return 1;
    }

    return 0;
})->purpose('Validate the configured private media storage disk');

Artisan::command('reports:aggregate-daily {date?}', function (?string $date = null) {
    $date ??= now()->subDay()->toDateString();
    AggregatePartnerDailyStats::dispatchSync($date);
    AggregateAdminDailyStats::dispatchSync($date);
    $this->info("Daily reports aggregated for {$date}.");
})->purpose('Aggregate partner and admin daily statistics');

Artisan::command('reports:aggregate-monthly {year?} {month?}', function (?int $year = null, ?int $month = null) {
    $period = now()->subMonth();
    AggregatePartnerMonthlyReports::dispatchSync($year ?? $period->year, $month ?? $period->month);
    $this->info(sprintf('Monthly reports aggregated for %04d-%02d.', $year ?? $period->year, $month ?? $period->month));
})->purpose('Aggregate partner monthly reports');
