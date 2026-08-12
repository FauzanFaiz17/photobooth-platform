<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $query = AuditLog::query()->latest('created_at');
        if ($request->filled('partner_id')) {
            $query->where('partner_id', $request->integer('partner_id'));
        }
        if ($request->filled('action')) {
            $query->where('action', $request->string('action'));
        }

        return ApiResponse::success($query->paginate(min($request->integer('per_page', 25), 100)), 'Audit logs retrieved.');
    }
}
