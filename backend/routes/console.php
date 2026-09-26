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
use App\Services\PlatformCredentialService;
use App\Services\VoucherService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('mail:test {email : Alamat tujuan tes}', function (string $email) {
    $this->line('mailer   : '.config('mail.default'));
    $this->line('host     : '.config('mail.mailers.smtp.host'));
    $this->line('port     : '.config('mail.mailers.smtp.port'));
    $this->line('scheme   : '.(config('mail.mailers.smtp.scheme') ?? '(default)'));
    $this->line('username : '.((string) config('mail.mailers.smtp.username')));
    $this->line('from     : '.config('mail.from.address'));
    $this->line('');

    if (config('mail.default') !== 'smtp') {
        $this->warn('MAIL_MAILER bukan "smtp" — email tidak akan benar-benar dikirim.');
        $this->line('Set MAIL_MAILER=smtp di .env hosting lalu `php artisan config:clear`.');
    }

    $started = microtime(true);

    try {
        Mail::raw('Tes SMTP Photobooth '.now()->toDateTimeString(), function ($message) use ($email) {
            $message->to($email)->subject('Tes SMTP Photobooth');
        });
    } catch (Throwable $exception) {
        $this->error('GAGAL terkirim.');
        for ($cause = $exception, $depth = 0; $cause && $depth < 5; $cause = $cause->getPrevious(), $depth++) {
            $this->line('  '.get_class($cause).': '.trim($cause->getMessage()));
        }

        return 1;
    }

    $this->info(sprintf('TERKIRIM ke %s dalam %.2f detik.', $email, microtime(true) - $started));
    $this->line('Cek inbox DAN folder SPAM penerima (folder Sent hosting TIDAK terisi oleh SMTP).');

    return 0;
})->purpose('Send a synchronous test email without tinker and without the queue');

Artisan::command('mail:status', function () {
    $smtp = config('mail.mailers.smtp');

    $this->table(['Mail / Queue', 'Value'], [
        ['MAIL_MAILER', (string) config('mail.default')],
        ['MAIL_HOST', (string) ($smtp['host'] ?? null)],
        ['MAIL_PORT', (string) ($smtp['port'] ?? null)],
        ['MAIL_USERNAME', (string) ($smtp['username'] ?? null)],
        ['MAIL_FROM_ADDRESS', (string) config('mail.from.address')],
        ['QUEUE_CONNECTION', (string) config('queue.default')],
        ['GALLERY_WEB_BASE_URL', (string) config('media.gallery_web_base_url')],
        ['Pending jobs', (string) DB::table('jobs')->count()],
        ['Reserved jobs (worker sedang proses)', (string) DB::table('jobs')->whereNotNull('reserved_at')->count()],
        ['Failed jobs', (string) DB::table('failed_jobs')->count()],
    ]);

    $lastFailed = DB::table('failed_jobs')->orderByDesc('failed_at')->first();
    if ($lastFailed) {
        $this->error('Job terakhir gagal: '.($lastFailed->failed_at ?? '-'));
        $this->line(Str::limit($lastFailed->exception, 600));
        $this->line('');
    }

    $sessions = DB::table('photo_sessions')
        ->leftJoin('customers', 'customers.id', '=', 'photo_sessions.customer_id')
        ->select('photo_sessions.id as id', 'photo_sessions.status as status', 'customers.email as email')
        ->orderByDesc('photo_sessions.id')
        ->limit(5)
        ->get();

    if ($sessions->isEmpty()) {
        $this->warn('Belum ada photo_sessions.');

        return 0;
    }

    $this->table(['Session', 'Status', 'Customer email'], $sessions->map(fn ($row) => [
        '#'.$row->id,
        $row->status,
        $row->email ?? '(kosong — email TIDAK akan dikirim)',
    ])->all());

    if ($lastFailed === null && DB::table('jobs')->count() === 0) {
        $this->line('Tidak ada job antrean/gagal. Kalau email tetap tidak masuk, berarti dispatch tidak pernah jalan → customer email kosong.');
    }

    return 0;
})->purpose('Inspect mail config, queue depth, and recent photo session emails');

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
    $credentials = app(PlatformCredentialService::class);
    $r2 = $credentials->r2();
    $disk = $r2['enabled'] ? 'r2' : config('media.disk', 'local');
    $filesystem = $disk === 'r2' ? [
        'driver' => 's3',
        'key' => $r2['access_key_id'],
        'secret' => $r2['secret_access_key'],
        'bucket' => $r2['bucket'],
        'endpoint' => $r2['endpoint'],
    ] : config("filesystems.disks.{$disk}", []);
    $required = $disk === 'r2' ? ['key', 'secret', 'bucket', 'endpoint'] : [];
    $missing = collect($required)
        ->filter(fn (string $key) => blank($filesystem[$key] ?? null))
        ->values();

    $this->table([
        'Setting',
        'Value',
    ], [
        ['Active disk', $disk],
        ['Configuration source', $disk === 'r2' ? $r2['source'] : 'environment'],
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
        $credentials->r2Disk($r2)->exists('__photobooth_storage_check__');
        $this->info("Storage disk [{$disk}] is reachable.");
    } catch (Throwable $exception) {
        $messages = [];
        for ($cause = $exception; $cause && count($messages) < 4; $cause = $cause->getPrevious()) {
            $message = trim($cause->getMessage());
            if ($message !== '' && ! in_array($message, $messages, true)) {
                $messages[] = $message;
            }
        }

        $this->error('Storage check failed: '.implode(' | Caused by: ', $messages));

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
