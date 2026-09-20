<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PrinterAlert\StoreAlertSettingRequest;
use App\Http\Requests\PrinterAlert\StoreRecipientRequest;
use App\Http\Requests\PrinterAlert\UpdateAlertSettingRequest;
use App\Http\Resources\PrinterAlertSettingResource;
use App\Models\Printer;
use App\Models\PrinterAlertLog;
use App\Models\PrinterAlertRecipient;
use App\Models\PrinterAlertSetting;
use App\Services\PrinterAlertService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrinterAlertController extends Controller
{
    public function __construct(
        protected PrinterAlertService $alertService,
    ) {}

    public function show(Printer $printer): JsonResponse
    {
        $this->authorize('view', $printer);

        $printer->load('alertSetting.recipients');

        $summary = $this->alertService->getAlertSummary($printer);

        return ApiResponse::success([
            'printer' => $printer->only('id', 'name', 'booth_id'),
            'alert_setting' => $printer->alertSetting
                ? new PrinterAlertSettingResource($printer->alertSetting)
                : null,
            'summary' => $summary,
        ]);
    }

    public function store(StoreAlertSettingRequest $request, Printer $printer): JsonResponse
    {
        $this->authorize('update', $printer);

        $setting = PrinterAlertSetting::updateOrCreate(
            ['printer_id' => $printer->id],
            $request->validated()
        );

        return ApiResponse::success(
            new PrinterAlertSettingResource($setting->load('recipients')),
            'Alert setting saved.',
            201
        );
    }

    public function update(UpdateAlertSettingRequest $request, Printer $printer): JsonResponse
    {
        $this->authorize('update', $printer);

        $setting = $printer->alertSetting;

        if (! $setting) {
            return ApiResponse::error('No alert setting configured for this printer.', null, 404);
        }

        $setting->update($request->validated());

        return ApiResponse::success(
            new PrinterAlertSettingResource($setting->fresh()->load('recipients')),
            'Alert setting updated.'
        );
    }

    public function destroy(Printer $printer): JsonResponse
    {
        $this->authorize('update', $printer);

        $setting = $printer->alertSetting;

        if (! $setting) {
            return ApiResponse::error('No alert setting configured for this printer.', null, 404);
        }

        $setting->delete();

        return ApiResponse::success(null, 'Alert setting deleted.');
    }

    public function storeRecipient(StoreRecipientRequest $request, Printer $printer): JsonResponse
    {
        $this->authorize('update', $printer);

        $setting = $printer->alertSetting;

        if (! $setting) {
            return ApiResponse::error('Configure alert setting first.', null, 422);
        }

        $recipient = PrinterAlertRecipient::updateOrCreate(
            ['alert_setting_id' => $setting->id, 'email' => $request->email],
            ['is_active' => $request->boolean('is_active', true)]
        );

        return ApiResponse::success(
            new PrinterAlertSettingResource($setting->fresh()->load('recipients')),
            'Recipient saved.',
            201
        );
    }

    public function destroyRecipient(Printer $printer, PrinterAlertRecipient $recipient): JsonResponse
    {
        $this->authorize('update', $printer);

        $setting = $printer->alertSetting;

        if (! $setting || $recipient->alert_setting_id !== $setting->id) {
            return ApiResponse::error('Recipient not found for this printer.', null, 404);
        }

        $recipient->delete();

        return ApiResponse::success(
            new PrinterAlertSettingResource($setting->fresh()->load('recipients')),
            'Recipient removed.'
        );
    }

    public function logs(Request $request, Printer $printer): JsonResponse
    {
        $this->authorize('view', $printer);

        $setting = $printer->alertSetting;

        if (! $setting) {
            return ApiResponse::success([]);
        }

        $logs = PrinterAlertLog::where('alert_setting_id', $setting->id)
            ->latest('sent_at')
            ->paginate($request->integer('per_page', 20));

        return ApiResponse::success($logs);
    }
}
