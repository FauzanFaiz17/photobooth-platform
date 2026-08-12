<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AdminDailyStat;
use App\Models\PartnerDailyStat;
use App\Models\PartnerMonthlyReport;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function daily(Request $request)
    {
        $query = PartnerDailyStat::query()->latest('stat_date');
        if (! $request->user()->isSuperAdmin()) {
            $query->where('partner_id', $request->user()->partner_id);
        } elseif ($request->filled('partner_id')) {
            $query->where('partner_id', $request->integer('partner_id'));
        }

        return ApiResponse::success($query->paginate(min($request->integer('per_page', 25), 100)), 'Daily reports retrieved.');
    }

    public function monthly(Request $request)
    {
        $query = PartnerMonthlyReport::query()->latest('generated_at');
        if (! $request->user()->isSuperAdmin()) {
            $query->where('partner_id', $request->user()->partner_id);
        } elseif ($request->filled('partner_id')) {
            $query->where('partner_id', $request->integer('partner_id'));
        }

        return ApiResponse::success($query->paginate(min($request->integer('per_page', 25), 100)), 'Monthly reports retrieved.');
    }

    public function adminDaily(Request $request)
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        return ApiResponse::success(AdminDailyStat::query()->latest('stat_date')->paginate(min($request->integer('per_page', 25), 100)), 'Admin daily reports retrieved.');
    }
}
