<?php

namespace Tests\Feature;

use App\Models\Booth;
use App\Models\CameraProfile;
use App\Models\CameraSnapshot;
use App\Models\Device;
use App\Models\Event;
use App\Models\Filter;
use App\Models\FilterSnapshot;
use App\Models\Media;
use App\Models\Permission;
use App\Models\PhotoSession;
use App\Models\Printer;
use App\Models\PrinterProfile;
use App\Models\PrinterSnapshot;
use App\Models\PrintJob;
use App\Models\Template;
use App\Models\TemplateSnapshot;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

class PrintingApiTest extends ApiTestCase
{
    public function test_printer_management_is_tenant_safe_and_validates_assignments(): void
    {
        [$partner, $operator, $booth, $device] = $this->context('management');
        [$otherPartner, , $otherBooth, $otherDevice] = $this->context('other');
        $this->authenticateAsSuperAdmin();

        $printerId = $this->postJson('/api/v1/printers', [
            'partner_id' => $partner->id,
            'booth_id' => $booth->id,
            'device_id' => $device->id,
            'name' => 'DNP DS-RX1',
            'driver_name' => 'DNP DS-RX1',
        ])->assertCreated()->assertJsonPath('data.partner_id', $partner->id)->json('data.id');

        $this->postJson('/api/v1/printers', [
            'partner_id' => $partner->id,
            'booth_id' => $otherBooth->id,
            'device_id' => $otherDevice->id,
            'name' => 'Invalid Printer',
        ])->assertUnprocessable()->assertJsonValidationErrors('booth_id');

        foreach (['printers.view', 'printers.create', 'printers.update', 'printers.delete'] as $slug) {
            $operator->role->permissions()->attach(Permission::where('slug', $slug)->firstOrFail());
        }
        Sanctum::actingAs($operator);
        $this->getJson('/api/v1/printers')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/v1/printers/'.Printer::where('partner_id', $otherPartner->id)->value('id'))->assertForbidden();
        $this->getJson("/api/v1/printers/{$printerId}")->assertOk();
    }

    public function test_completed_session_can_queue_idempotent_job_and_desktop_can_process_it(): void
    {
        Storage::fake('local');
        [$partner, $operator, $booth, $device] = $this->context('flow');
        $printer = Printer::create(['partner_id' => $partner->id, 'booth_id' => $booth->id, 'device_id' => $device->id, 'name' => 'Flow Printer', 'is_active' => true]);
        $session = $this->completedSession($partner->id, $booth->id, $device->id, $operator->id);
        Storage::disk('local')->put("sessions/{$session->id}/final.png", 'printable-image');
        Media::create([
            'photo_session_id' => $session->id, 'type' => 'template', 'bucket' => 'local',
            'object_key' => "sessions/{$session->id}/final.png", 'filename' => 'final.png',
            'mime_type' => 'image/png', 'size_bytes' => 15, 'checksum' => hash('sha256', 'printable-image'),
            'visibility' => 'private',
        ]);
        $this->authenticateAsSuperAdmin();
        $payload = ['photo_session_id' => $session->id, 'printer_id' => $printer->id, 'copies' => 2, 'idempotency_key' => 'print-flow-001'];
        $jobId = $this->postJson('/api/v1/print-jobs', $payload)->assertCreated()->assertJsonPath('data.status', 'queued')->json('data.id');
        $this->postJson('/api/v1/print-jobs', $payload)->assertCreated()->assertJsonPath('data.id', $jobId);
        $this->assertDatabaseCount('print_jobs', 1);

        Sanctum::actingAs($operator);
        $headers = ['X-Device-UUID' => $device->device_uuid];
        $this->withHeaders($headers)->getJson('/api/v1/desktop/print-jobs')->assertOk()->assertJsonPath('data.0.id', $jobId)->assertJsonPath('data.0.printable_media.filename', 'final.png');
        $this->assertSame('printing', PrintJob::findOrFail($jobId)->status);
        $this->withHeaders($headers)->getJson('/api/v1/desktop/print-jobs')->assertOk()->assertJsonCount(0, 'data');
        $this->withHeaders($headers)->get("/api/v1/desktop/print-jobs/{$jobId}/media")->assertOk()->assertHeader('content-type', 'image/png')->assertStreamedContent('printable-image');
        $this->withHeaders($headers)->postJson("/api/v1/desktop/print-jobs/{$jobId}/status", ['status' => 'printing'])->assertOk()->assertJsonPath('data.status', 'printing');
        $this->withHeaders($headers)->postJson("/api/v1/desktop/print-jobs/{$jobId}/status", ['status' => 'success', 'duration_ms' => 4200])->assertOk()->assertJsonPath('data.status', 'success')->assertJsonPath('data.duration_ms', 4200);
        $this->withHeaders($headers)->getJson('/api/v1/desktop/print-jobs')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_failed_job_requires_error_and_can_be_retried_but_terminal_jobs_cannot_regress(): void
    {
        [$partner, $operator, $booth, $device] = $this->context('retry');
        $printer = Printer::create(['partner_id' => $partner->id, 'booth_id' => $booth->id, 'device_id' => $device->id, 'name' => 'Retry Printer', 'is_active' => true]);
        $session = $this->completedSession($partner->id, $booth->id, $device->id, $operator->id);
        $job = PrintJob::create(['partner_id' => $partner->id, 'photo_session_id' => $session->id, 'printer_id' => $printer->id, 'copies' => 1, 'status' => 'printing', 'queued_at' => now(), 'started_at' => now()]);
        Sanctum::actingAs($operator);
        $headers = ['X-Device-UUID' => $device->device_uuid];
        $this->withHeaders($headers)->postJson("/api/v1/desktop/print-jobs/{$job->id}/status", ['status' => 'failed'])->assertUnprocessable()->assertJsonValidationErrors('error_log');
        $this->withHeaders($headers)->postJson("/api/v1/desktop/print-jobs/{$job->id}/status", ['status' => 'failed', 'error_log' => 'Paper jam'])->assertOk();
        $this->authenticateAsSuperAdmin();
        $this->postJson("/api/v1/print-jobs/{$job->id}/retry")->assertOk()->assertJsonPath('data.status', 'queued')->assertJsonPath('data.error_log', null);
        $this->postJson("/api/v1/print-jobs/{$job->id}/transition", ['status' => 'cancelled'])->assertOk();
        $this->postJson("/api/v1/print-jobs/{$job->id}/retry")->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    public function test_completing_session_auto_queues_one_job_from_immutable_printer_snapshot(): void
    {
        Storage::fake('local');
        [$partner, $operator, $booth, $device] = $this->context('auto');
        $event = $this->printableEvent($partner->id, $booth->id, $operator->id, 2);
        Sanctum::actingAs($operator);
        $headers = ['X-Device-UUID' => $device->device_uuid];

        $sessionId = $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/photo-sessions', ['event_id' => $event->id])
            ->assertCreated()
            ->json('data.id');

        $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/media", [
                'type' => 'template',
                'filename' => 'auto-final.png',
                'mime_type' => 'image/png',
                'data_url' => 'data:image/png;base64,'.base64_encode('auto-print'),
            ])->assertCreated();

        $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/complete")
            ->assertOk();
        $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/complete")
            ->assertOk();

        $this->assertDatabaseCount('print_jobs', 1);
        $this->assertDatabaseHas('print_jobs', [
            'photo_session_id' => $sessionId,
            'printer_snapshot_id' => $event->printer_snapshot_id,
            'idempotency_key' => "session:{$sessionId}",
            'copies' => 2,
            'status' => 'queued',
        ]);
    }

    public function test_locally_printed_session_does_not_queue_a_duplicate_backend_job(): void
    {
        Storage::fake('local');
        [$partner, $operator, $booth, $device] = $this->context('local-print');
        $event = $this->printableEvent($partner->id, $booth->id, $operator->id, 1);
        Sanctum::actingAs($operator);
        $headers = ['X-Device-UUID' => $device->device_uuid];

        $sessionId = $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/photo-sessions', ['event_id' => $event->id])
            ->assertCreated()
            ->json('data.id');

        $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/media", [
                'type' => 'template',
                'filename' => 'original-final.png',
                'mime_type' => 'image/png',
                'data_url' => 'data:image/png;base64,'.base64_encode('original-image'),
            ])->assertCreated();

        $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/complete", [
                'printed_locally' => true,
            ])
            ->assertOk();

        $this->assertDatabaseMissing('print_jobs', ['photo_session_id' => $sessionId]);
        $this->assertDatabaseHas('photo_sessions', [
            'id' => $sessionId,
            'status' => 'completed',
        ]);
    }

    public function test_expired_desktop_lease_is_returned_to_queue_and_reclaimed(): void
    {
        config()->set('printing.lease_seconds', 30);
        [$partner, $operator, $booth, $device] = $this->context('lease');
        $printer = Printer::where('device_id', $device->id)->firstOrFail();
        $session = $this->completedSession($partner->id, $booth->id, $device->id, $operator->id);
        $job = PrintJob::create([
            'partner_id' => $partner->id,
            'photo_session_id' => $session->id,
            'printer_id' => $printer->id,
            'copies' => 1,
            'status' => 'printing',
            'queued_at' => now()->subMinutes(2),
            'started_at' => now()->subMinutes(2),
        ]);
        $job->forceFill(['updated_at' => now()->subMinute()])->saveQuietly();

        Sanctum::actingAs($operator);
        $this->withHeader('X-Device-UUID', $device->device_uuid)
            ->getJson('/api/v1/desktop/print-jobs')
            ->assertOk()
            ->assertJsonPath('data.0.id', $job->id)
            ->assertJsonPath('data.0.status', 'printing');

        $this->assertNotNull($job->fresh()->started_at);
        $this->assertNull($job->fresh()->error_log);
    }

    private function context(string $suffix): array
    {
        $partner = $this->createPartner(['slug' => "print-{$suffix}", 'email' => "print-{$suffix}@example.test"]);
        $booth = Booth::create(['partner_id' => $partner->id, 'name' => "Print Booth {$suffix}", 'status' => 'active']);
        $operator = $this->createOperator($partner, ['email' => "print-operator-{$suffix}@example.test"]);
        $device = Device::create(['partner_id' => $partner->id, 'booth_id' => $booth->id, 'device_key' => "print-device-{$suffix}", 'device_uuid' => sprintf('dddddddd-dddd-4ddd-8ddd-%012d', Device::count() + 1), 'device_name' => "Print Device {$suffix}", 'status' => 'active']);
        $printer = Printer::create(['partner_id' => $partner->id, 'booth_id' => $booth->id, 'device_id' => $device->id, 'name' => "Existing {$suffix}", 'is_active' => true]);

        return [$partner, $operator, $booth, $device, $printer];
    }

    private function completedSession(int $partnerId, int $boothId, int $deviceId, int $operatorId): PhotoSession
    {
        return PhotoSession::create(['partner_id' => $partnerId, 'booth_id' => $boothId, 'device_id' => $deviceId, 'operator_id' => $operatorId, 'download_token' => str_repeat((string) (PhotoSession::count() % 10), 64), 'status' => 'completed', 'started_at' => now()->subMinute(), 'completed_at' => now()]);
    }

    private function printableEvent(int $partnerId, int $boothId, int $operatorId, int $copies): Event
    {
        $template = Template::create(['partner_id' => $partnerId, 'name' => 'Print Template', 'json_layout' => [], 'version' => 1, 'status' => 'published']);
        $filter = Filter::create(['partner_id' => $partnerId, 'name' => 'Print Filter', 'version' => 1, 'is_active' => true]);
        $camera = CameraProfile::create(['partner_id' => $partnerId, 'name' => 'Print Camera', 'countdown_seconds' => 3, 'burst_count' => 1, 'live_view' => true, 'version' => 1, 'is_active' => true]);
        $printer = PrinterProfile::create(['partner_id' => $partnerId, 'printer_name' => 'Print Profile', 'copies' => $copies, 'paper_size' => '4x6', 'orientation' => 'portrait', 'auto_print' => true, 'border' => false, 'bleed' => 0, 'delay_ms' => 0, 'version' => 1, 'is_active' => true]);

        $templateSnapshot = TemplateSnapshot::create(['template_id' => $template->id, 'name' => $template->name, 'json_layout' => [], 'version' => 1]);
        $filterSnapshot = FilterSnapshot::create(['filter_id' => $filter->id, 'name' => $filter->name, 'brightness' => 0, 'contrast' => 0, 'saturation' => 0, 'sharpness' => 0, 'white_balance' => 0, 'intensity' => 100, 'version' => 1]);
        $cameraSnapshot = CameraSnapshot::create(['camera_profile_id' => $camera->id, 'countdown_seconds' => 3, 'burst_count' => 1, 'live_view' => true, 'version' => 1]);
        $printerSnapshot = PrinterSnapshot::create(['printer_profile_id' => $printer->id, 'printer_name' => $printer->printer_name, 'copies' => $copies, 'paper_size' => '4x6', 'orientation' => 'portrait', 'auto_print' => true, 'border' => false, 'bleed' => 0, 'delay_ms' => 0, 'version' => 1]);

        return Event::create([
            'partner_id' => $partnerId, 'booth_id' => $boothId, 'created_by' => $operatorId,
            'event_name' => 'Printable Event', 'event_code' => 'PRINT-'.str_pad((string) Event::count(), 6, '0', STR_PAD_LEFT),
            'template_snapshot_id' => $templateSnapshot->id, 'filter_snapshot_id' => $filterSnapshot->id,
            'camera_snapshot_id' => $cameraSnapshot->id, 'printer_snapshot_id' => $printerSnapshot->id,
            'event_date' => now()->toDateString(), 'start_time' => '08:00:00', 'end_time' => '20:00:00',
            'price' => 35000, 'print_count_limit' => 0, 'status' => 'ongoing',
        ]);
    }
}
