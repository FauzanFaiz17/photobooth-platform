<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CameraSnapshot extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'camera_profile_id',
        'iso',
        'shutter_speed',
        'aperture',
        'white_balance',
        'exposure',
        'focus_mode',
        'countdown_seconds',
        'burst_count',
        'image_quality',
        'live_view',
        'version',
        'created_at',
    ];

    protected $casts = [
        'countdown_seconds' => 'integer',
        'burst_count' => 'integer',
        'live_view' => 'boolean',
        'version' => 'integer',
        'created_at' => 'datetime',
    ];

    public function cameraProfile(): BelongsTo
    {
        return $this->belongsTo(CameraProfile::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }
}
