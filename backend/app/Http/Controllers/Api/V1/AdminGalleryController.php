<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminGalleryResource;
use App\Models\PhotoSession;
use Illuminate\Http\Request;

class AdminGalleryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = PhotoSession::query()
            ->with(['customer', 'media', 'downloadAccess'])
            ->where('status', 'completed')
            ->latest('completed_at');

        if (! $user->isSuperAdmin()) {
            $query->where('partner_id', $user->partner_id);
        } elseif ($request->filled('partner_id')) {
            $query->where('partner_id', $request->integer('partner_id'));
        }

        return AdminGalleryResource::collection($query->paginate($request->integer('per_page', 20)));
    }

    public function show(PhotoSession $photoSession)
    {
        $this->authorizeGallery($photoSession);

        return new AdminGalleryResource($photoSession->load(['customer', 'media', 'downloadAccess']));
    }

    private function authorizeGallery(PhotoSession $session): void
    {
        $user = request()->user();
        abort_unless($user->isSuperAdmin() || $session->partner_id === $user->partner_id, 404);
    }
}
