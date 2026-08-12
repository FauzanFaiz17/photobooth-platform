<?php

namespace Tests\Feature;

use App\Models\Booth;
use App\Models\Device;
use App\Models\PhotoSession;
use App\Models\Media;
use App\Models\Printer;
use App\Models\PrintJob;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\Storage;

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
            $operator->role->permissions()->attach(\App\Models\Permission::where('slug', $slug)->firstOrFail());
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
        $printer = Printer::create(['partner_id'=>$partner->id,'booth_id'=>$booth->id,'device_id'=>$device->id,'name'=>'Flow Printer','is_active'=>true]);
        $session = $this->completedSession($partner->id, $booth->id, $device->id, $operator->id);
        Storage::disk('local')->put("sessions/{$session->id}/final.png", 'printable-image');
        Media::create([
            'photo_session_id' => $session->id, 'type' => 'template', 'bucket' => 'local',
            'object_key' => "sessions/{$session->id}/final.png", 'filename' => 'final.png',
            'mime_type' => 'image/png', 'size_bytes' => 15, 'checksum' => hash('sha256', 'printable-image'),
            'visibility' => 'private',
        ]);
        $this->authenticateAsSuperAdmin();
        $payload = ['photo_session_id'=>$session->id,'printer_id'=>$printer->id,'copies'=>2,'idempotency_key'=>'print-flow-001'];
        $jobId = $this->postJson('/api/v1/print-jobs',$payload)->assertCreated()->assertJsonPath('data.status','queued')->json('data.id');
        $this->postJson('/api/v1/print-jobs',$payload)->assertCreated()->assertJsonPath('data.id',$jobId);
        $this->assertDatabaseCount('print_jobs',1);

        Sanctum::actingAs($operator);
        $headers=['X-Device-UUID'=>$device->device_uuid];
        $this->withHeaders($headers)->getJson('/api/v1/desktop/print-jobs')->assertOk()->assertJsonPath('data.0.id',$jobId)->assertJsonPath('data.0.printable_media.filename','final.png');
        $this->withHeaders($headers)->get("/api/v1/desktop/print-jobs/{$jobId}/media")->assertOk()->assertHeader('content-type','image/png')->assertStreamedContent('printable-image');
        $this->withHeaders($headers)->postJson("/api/v1/desktop/print-jobs/{$jobId}/status",['status'=>'printing'])->assertOk()->assertJsonPath('data.status','printing');
        $this->withHeaders($headers)->postJson("/api/v1/desktop/print-jobs/{$jobId}/status",['status'=>'success','duration_ms'=>4200])->assertOk()->assertJsonPath('data.status','success')->assertJsonPath('data.duration_ms',4200);
        $this->withHeaders($headers)->getJson('/api/v1/desktop/print-jobs')->assertOk()->assertJsonCount(0,'data');
    }

    public function test_failed_job_requires_error_and_can_be_retried_but_terminal_jobs_cannot_regress(): void
    {
        [$partner, $operator, $booth, $device] = $this->context('retry');
        $printer=Printer::create(['partner_id'=>$partner->id,'booth_id'=>$booth->id,'device_id'=>$device->id,'name'=>'Retry Printer','is_active'=>true]);
        $session=$this->completedSession($partner->id,$booth->id,$device->id,$operator->id);
        $job=PrintJob::create(['partner_id'=>$partner->id,'photo_session_id'=>$session->id,'printer_id'=>$printer->id,'copies'=>1,'status'=>'printing','queued_at'=>now(),'started_at'=>now()]);
        Sanctum::actingAs($operator); $headers=['X-Device-UUID'=>$device->device_uuid];
        $this->withHeaders($headers)->postJson("/api/v1/desktop/print-jobs/{$job->id}/status",['status'=>'failed'])->assertUnprocessable()->assertJsonValidationErrors('error_log');
        $this->withHeaders($headers)->postJson("/api/v1/desktop/print-jobs/{$job->id}/status",['status'=>'failed','error_log'=>'Paper jam'])->assertOk();
        $this->authenticateAsSuperAdmin();
        $this->postJson("/api/v1/print-jobs/{$job->id}/retry")->assertOk()->assertJsonPath('data.status','queued')->assertJsonPath('data.error_log',null);
        $this->postJson("/api/v1/print-jobs/{$job->id}/transition",['status'=>'cancelled'])->assertOk();
        $this->postJson("/api/v1/print-jobs/{$job->id}/retry")->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    private function context(string $suffix): array
    {
        $partner=$this->createPartner(['slug'=>"print-{$suffix}",'email'=>"print-{$suffix}@example.test"]);
        $booth=Booth::create(['partner_id'=>$partner->id,'name'=>"Print Booth {$suffix}",'status'=>'active']);
        $operator=$this->createOperator($partner,['email'=>"print-operator-{$suffix}@example.test"]);
        $device=Device::create(['partner_id'=>$partner->id,'booth_id'=>$booth->id,'device_key'=>"print-device-{$suffix}",'device_uuid'=>sprintf('dddddddd-dddd-4ddd-8ddd-%012d',Device::count()+1),'device_name'=>"Print Device {$suffix}",'status'=>'active']);
        $printer=Printer::create(['partner_id'=>$partner->id,'booth_id'=>$booth->id,'device_id'=>$device->id,'name'=>"Existing {$suffix}",'is_active'=>true]);
        return [$partner,$operator,$booth,$device,$printer];
    }

    private function completedSession(int $partnerId,int $boothId,int $deviceId,int $operatorId): PhotoSession
    {
        return PhotoSession::create(['partner_id'=>$partnerId,'booth_id'=>$boothId,'device_id'=>$deviceId,'operator_id'=>$operatorId,'download_token'=>str_repeat((string)(PhotoSession::count()%10),64),'status'=>'completed','started_at'=>now()->subMinute(),'completed_at'=>now()]);
    }
}
