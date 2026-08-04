<?php

namespace App\Services\Snapshots;

use App\Models\CameraProfile;
use App\Models\CameraSnapshot;

class CameraSnapshotService
{
    public function create(CameraProfile $camera): CameraSnapshot
    {
        return CameraSnapshot::create([
            'camera_profile_id' => $camera->id,
            'iso'               => $camera->iso,
            'shutter_speed'     => $camera->shutter_speed,
            'aperture'          => $camera->aperture,
            'white_balance'     => $camera->white_balance,
            'exposure'          => $camera->exposure,
            'focus_mode'        => $camera->focus_mode,
            'countdown_seconds' => $camera->countdown_seconds,
            'burst_count'       => $camera->burst_count,
            'image_quality'     => $camera->image_quality,
            'live_view'         => $camera->live_view,
            'version'           => $camera->version,
        ]);
    }
}