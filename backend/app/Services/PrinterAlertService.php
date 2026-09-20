<?php

namespace App\Services;

use App\Mail\PrinterLowStockMail;
use App\Models\Printer;
use App\Models\PrinterAlertLog;
use App\Models\PrinterAlertSetting;
use Illuminate\Support\Facades\Mail;

class PrinterAlertService
{
    public function __construct(protected AuditService $auditService) {}

    public function checkAndNotify(Printer $printer): void
    {
        $printer->loadMissing('alertSetting.recipients');

        $setting = $printer->alertSetting;

        if (! $setting || ! $setting->is_active) {
            return;
        }

        $activeRecipients = $setting->recipients->where('is_active', true);

        if ($activeRecipients->isEmpty()) {
            return;
        }

        $remainingPrints = $this->getRemainingPrints($printer, $setting);

        if ($remainingPrints > $setting->low_stock_threshold) {
            return;
        }

        if ($this->shouldDebounce($setting)) {
            return;
        }

        $this->sendNotifications($setting, $activeRecipients, $remainingPrints);
    }

    public function getRemainingPrints(Printer $printer, ?PrinterAlertSetting $setting = null): int
    {
        $setting = $setting ?? $printer->alertSetting;

        if (! $setting) {
            return PHP_INT_MAX;
        }

        $totalPrints = $this->countSuccessfulPrints($printer);

        return max(0, $setting->total_print_limit - $totalPrints);
    }

    public function countSuccessfulPrints(Printer $printer): int
    {
        return (int) $printer->printJobs()
            ->where('status', 'success')
            ->sum('copies');
    }

    public function getAlertSummary(Printer $printer): array
    {
        $setting = $printer->alertSetting;

        if (! $setting) {
            return [
                'is_configured' => false,
                'remaining_prints' => null,
                'total_print_limit' => null,
                'low_stock_threshold' => null,
                'is_alert' => false,
                'recipients_count' => 0,
                'last_notified_at' => null,
            ];
        }

        $remainingPrints = $this->getRemainingPrints($printer, $setting);

        return [
            'is_configured' => true,
            'remaining_prints' => $remainingPrints,
            'total_print_limit' => $setting->total_print_limit,
            'low_stock_threshold' => $setting->low_stock_threshold,
            'is_alert' => $remainingPrints <= $setting->low_stock_threshold,
            'recipients_count' => $setting->recipients->where('is_active', true)->count(),
            'last_notified_at' => $setting->last_notified_at,
        ];
    }

    private function shouldDebounce(PrinterAlertSetting $setting): bool
    {
        if (! $setting->last_notified_at) {
            return false;
        }

        $cooldownMinutes = (int) config('printer_alerts.cooldown_minutes', 60);

        return $setting->last_notified_at->addMinutes($cooldownMinutes)->isFuture();
    }

    private function sendNotifications(
        PrinterAlertSetting $setting,
        $recipients,
        int $remainingPrints
    ): void {
        $printer = $setting->printer;

        foreach ($recipients as $recipient) {
            Mail::to($recipient->email)->send(
                new PrinterLowStockMail($printer, $remainingPrints, $setting->low_stock_threshold)
            );

            PrinterAlertLog::create([
                'alert_setting_id' => $setting->id,
                'recipient_email' => $recipient->email,
                'remaining_prints' => $remainingPrints,
                'channel' => 'email',
                'sent_at' => now(),
            ]);
        }

        $setting->update(['last_notified_at' => now()]);

        $this->auditService->record('printer_alert', null, $printer, 'Low stock alert sent.', [
            'printer_id' => $printer->id,
            'remaining_prints' => $remainingPrints,
            'threshold' => $setting->low_stock_threshold,
            'recipients_count' => $recipients->count(),
        ]);
    }
}
