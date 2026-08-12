<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PlatformSettings\UpdateMidtransSettingsRequest;
use App\Http\Requests\PlatformSettings\UpdateR2SettingsRequest;
use App\Services\AuditService;
use App\Services\PlatformCredentialService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class PlatformCredentialController extends Controller
{
    public function __construct(
        protected PlatformCredentialService $credentials,
        protected AuditService $auditService
    ) {}

    public function midtrans(Request $request)
    {
        $this->authorizeSuperAdmin($request);

        return ApiResponse::success($this->credentials->midtransSummary(), 'Midtrans configuration retrieved.');
    }

    public function updateMidtrans(UpdateMidtransSettingsRequest $request)
    {
        $configuration = $this->credentials->updateMidtrans($request->validated(), $request->user());
        $this->auditService->record('update', $request->user(), null, 'Midtrans credential configuration updated.', [
            'environment' => $configuration['production'] ? 'production' : 'sandbox',
            'qris_enabled' => $configuration['qris_enabled'],
        ]);

        return ApiResponse::success($this->credentials->midtransSummary(), 'Midtrans configuration updated.');
    }

    public function testMidtrans(Request $request)
    {
        $this->authorizeSuperAdmin($request);
        $result = $this->credentials->testMidtrans();
        $this->auditService->record('update', $request->user(), null, 'Midtrans credential connection tested.', [
            'connected' => $result['connected'],
        ]);

        return ApiResponse::success($result, 'Midtrans connection succeeded.');
    }

    public function clearMidtrans(Request $request)
    {
        $this->authorizeSuperAdmin($request);
        $this->credentials->clearMidtrans();
        $this->auditService->record('delete', $request->user(), null, 'Midtrans database credential override removed.');

        return ApiResponse::success($this->credentials->midtransSummary(), 'Midtrans configuration reset to environment fallback.');
    }

    public function r2(Request $request)
    {
        $this->authorizeSuperAdmin($request);

        return ApiResponse::success($this->credentials->r2Summary(), 'Cloudflare R2 configuration retrieved.');
    }

    public function updateR2(UpdateR2SettingsRequest $request)
    {
        $configuration = $this->credentials->updateR2($request->validated(), $request->user());
        $this->auditService->record('update', $request->user(), null, 'Cloudflare R2 credential configuration updated.', [
            'enabled' => $configuration['enabled'],
            'bucket' => $configuration['bucket'],
            'endpoint' => $configuration['endpoint'],
        ]);

        return ApiResponse::success($this->credentials->r2Summary(), 'Cloudflare R2 configuration updated.');
    }

    public function testR2(Request $request)
    {
        $this->authorizeSuperAdmin($request);
        $result = $this->credentials->testR2();
        $this->auditService->record('update', $request->user(), null, 'Cloudflare R2 credential connection tested.', [
            'connected' => $result['connected'],
        ]);

        return ApiResponse::success($result, 'Cloudflare R2 connection succeeded.');
    }

    public function clearR2(Request $request)
    {
        $this->authorizeSuperAdmin($request);
        $this->credentials->clearR2();
        $this->auditService->record('delete', $request->user(), null, 'Cloudflare R2 database credential override removed.');

        return ApiResponse::success($this->credentials->r2Summary(), 'Cloudflare R2 configuration reset to environment fallback.');
    }

    private function authorizeSuperAdmin(Request $request): void
    {
        abort_unless($request->user()?->isSuperAdmin(), 403);
    }
}
