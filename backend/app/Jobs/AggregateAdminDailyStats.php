<?php

namespace App\Jobs;

use App\Models\AdminDailyStat;
use App\Models\AuditLog;
use App\Models\Booth;
use App\Models\Device;
use App\Models\Event;
use App\Models\Media;
use App\Models\Partner;
use App\Models\Payment;
use App\Models\PhotoSession;
use App\Models\PrintJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AggregateAdminDailyStats implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public string $date) {}

    public function handle(): void
    {
        $date = $this->date;
        $stat = AdminDailyStat::query()->whereDate('stat_date', $date)->first()
            ?? new AdminDailyStat(['stat_date' => $date]);
        $stat->fill([
            'total_partners' => Partner::whereDate('created_at', '<=', $date)->count(),
            'total_booths' => Booth::whereDate('created_at', '<=', $date)->count(),
            'total_devices' => Device::whereDate('created_at', '<=', $date)->count(),
            'total_events' => Event::whereDate('created_at', '<=', $date)->count(),
            'total_sessions' => PhotoSession::whereDate('started_at', $date)->count(),
            'total_payments' => Payment::whereDate('created_at', $date)->count(),
            'total_media' => Media::whereDate('created_at', $date)->count(),
            'total_print_jobs' => PrintJob::whereDate('created_at', $date)->count(),
            'total_uploads' => AuditLog::where('action', 'upload')->whereDate('created_at', $date)->count(),
            'total_downloads' => AuditLog::where('action', 'download')->whereDate('created_at', $date)->count(),
            'created_at' => now(),
        ])->save();
    }
}
