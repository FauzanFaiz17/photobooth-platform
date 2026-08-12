<?php

namespace Tests\Feature;

use App\Jobs\AggregateAdminDailyStats;
use App\Jobs\AggregatePartnerDailyStats;
use App\Jobs\AggregatePartnerMonthlyReports;
use App\Models\AuditLog;
use App\Models\Booth;
use App\Models\Device;
use App\Models\Payment;
use App\Models\Permission;
use App\Models\PhotoSession;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

class ReportingAuditTest extends ApiTestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_daily_monthly_and_admin_aggregation_are_idempotent_and_tenant_safe(): void
    {
        Carbon::setTestNow('2026-08-12 12:00:00');
        [$partner, $manager] = $this->reportContext('first', 50000);
        [$otherPartner] = $this->reportContext('second', 75000);

        AggregatePartnerDailyStats::dispatchSync('2026-08-12');
        AggregatePartnerDailyStats::dispatchSync('2026-08-12');
        AggregateAdminDailyStats::dispatchSync('2026-08-12');
        AggregatePartnerMonthlyReports::dispatchSync(2026, 8);

        $this->assertDatabaseCount('partner_daily_stats', 2);
        $this->assertDatabaseHas('partner_daily_stats', ['partner_id' => $partner->id, 'stat_date' => '2026-08-12 00:00:00', 'total_revenue' => 50000]);
        $this->assertDatabaseHas('partner_monthly_reports', ['partner_id' => $partner->id, 'period_year' => 2026, 'period_month' => 8, 'total_revenue' => 50000]);
        $this->assertDatabaseHas('admin_daily_stats', ['stat_date' => '2026-08-12 00:00:00', 'total_sessions' => 2, 'total_payments' => 2]);

        Sanctum::actingAs($manager);
        $this->getJson('/api/v1/reports/daily')->assertOk()->assertJsonCount(1, 'data.data')->assertJsonPath('data.data.0.partner_id', $partner->id);
        $this->getJson('/api/v1/reports/admin/daily')->assertForbidden();
        $this->getJson('/api/v1/audit-logs')->assertForbidden();

        $this->authenticateAsSuperAdmin();
        $this->getJson('/api/v1/reports/daily?partner_id='.$otherPartner->id)->assertOk()->assertJsonPath('data.data.0.partner_id', $otherPartner->id);
        $this->getJson('/api/v1/reports/admin/daily')->assertOk();
    }

    public function test_login_and_payment_operations_create_sanitized_audit_logs(): void
    {
        $this->postJson('/api/v1/login', ['email' => $this->superAdmin->email, 'password' => 'Password123!'])->assertOk();
        $this->assertDatabaseHas('audit_logs', ['action' => 'login', 'user_id' => $this->superAdmin->id]);
        $audit = AuditLog::firstOrFail();
        $this->assertArrayNotHasKey('password', $audit->metadata ?? []);

        $this->authenticateAsSuperAdmin();
        $this->getJson('/api/v1/audit-logs')->assertOk()->assertJsonPath('data.data.0.action', 'login');
    }

    private function reportContext(string $suffix, int $amount): array
    {
        $partner = $this->createPartner(['slug' => "report-{$suffix}", 'email' => "report-{$suffix}@example.test"]);
        $booth = Booth::create(['partner_id' => $partner->id, 'name' => "Report {$suffix}", 'status' => 'active']);
        $manager = $this->createOperator($partner, ['email' => "report-manager-{$suffix}@example.test"]);
        foreach (['payments.view'] as $slug) {
            $manager->role->permissions()->syncWithoutDetaching(Permission::where('slug', $slug)->firstOrFail());
        }
        $device = Device::create(['partner_id' => $partner->id, 'booth_id' => $booth->id, 'device_key' => "report-{$suffix}", 'device_uuid' => sprintf('ffffffff-ffff-4fff-8fff-%012d', Device::count() + 1), 'device_name' => "Report {$suffix}", 'status' => 'active']);
        Payment::create(['partner_id' => $partner->id, 'reference' => "REPORT-{$suffix}", 'gateway' => 'cash', 'amount' => $amount, 'fee' => 0, 'net_amount' => $amount, 'status' => 'paid', 'paid_at' => now()]);
        PhotoSession::create(['partner_id' => $partner->id, 'booth_id' => $booth->id, 'device_id' => $device->id, 'operator_id' => $manager->id, 'download_token' => str_pad($suffix, 64, 'x'), 'status' => 'completed', 'started_at' => now(), 'completed_at' => now()]);

        return [$partner, $manager];
    }
}
