<?php

namespace App\Jobs;

use App\Models\Media;
use App\Models\Partner;
use App\Models\PartnerDailyStat;
use App\Models\PartnerMonthlyReport;
use App\Models\Payment;
use App\Models\PhotoSession;
use App\Models\Voucher;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AggregatePartnerMonthlyReports implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $year, public int $month) {}

    public function handle(): void
    {
        foreach (Partner::query()->pluck('id') as $partnerId) {
            $stats = PartnerDailyStat::query()->where('partner_id', $partnerId)->whereYear('stat_date', $this->year)->whereMonth('stat_date', $this->month);
            $sessions = PhotoSession::query()->where('partner_id', $partnerId)->whereYear('started_at', $this->year)->whereMonth('started_at', $this->month);
            PartnerMonthlyReport::updateOrCreate(
                ['partner_id' => $partnerId, 'period_year' => $this->year, 'period_month' => $this->month],
                [
                    'total_revenue' => $stats->sum('total_revenue'),
                    'total_sessions' => $stats->sum('total_sessions'),
                    'total_customers' => (clone $sessions)->whereNotNull('customer_id')->distinct('customer_id')->count('customer_id'),
                    'total_prints' => $stats->sum('total_prints'),
                    'total_downloads' => $stats->sum('total_downloads'),
                    'total_media' => Media::query()->whereHas('photoSession', fn ($q) => $q->where('partner_id', $partnerId))->whereYear('created_at', $this->year)->whereMonth('created_at', $this->month)->count(),
                    'total_vouchers_used' => Voucher::query()->where('partner_id', $partnerId)->where('status', 'redeemed')->whereYear('redeemed_at', $this->year)->whereMonth('redeemed_at', $this->month)->count(),
                    'total_qris_transactions' => Payment::query()->where('partner_id', $partnerId)->where('gateway', 'midtrans_qris')->where('status', 'paid')->whereYear('paid_at', $this->year)->whereMonth('paid_at', $this->month)->count(),
                    'generated_at' => now(),
                ]
            );
        }
    }
}
