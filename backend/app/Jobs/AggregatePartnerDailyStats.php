<?php

namespace App\Jobs;

use App\Models\AuditLog;
use App\Models\Partner;
use App\Models\PartnerDailyStat;
use App\Models\Payment;
use App\Models\PhotoSession;
use App\Models\PrintJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class AggregatePartnerDailyStats implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public string $date) {}

    public function handle(): void
    {
        $date = Carbon::parse($this->date)->toDateString();

        foreach (Partner::query()->pluck('id') as $partnerId) {
            $sessions = PhotoSession::query()->where('partner_id', $partnerId)->whereDate('started_at', $date);
            $payments = Payment::query()->where('partner_id', $partnerId)->where('status', 'paid')->whereDate('paid_at', $date);
            $downloads = AuditLog::query()->where('partner_id', $partnerId)->where('action', 'download')->whereDate('created_at', $date);
            $prints = PrintJob::query()->where('partner_id', $partnerId)->where('status', 'success')->whereDate('finished_at', $date);

            $stat = PartnerDailyStat::query()
                ->where('partner_id', $partnerId)
                ->whereDate('stat_date', $date)
                ->first() ?? new PartnerDailyStat([
                    'partner_id' => $partnerId,
                    'stat_date' => $date,
                ]);
            $stat->fill([
                'total_revenue' => $payments->sum('amount'),
                'total_sessions' => $sessions->count(),
                'total_customers' => (clone $sessions)->whereNotNull('customer_id')->distinct('customer_id')->count('customer_id'),
                'total_prints' => $prints->sum('copies'),
                'total_downloads' => $downloads->count(),
            ])->save();
        }
    }
}
