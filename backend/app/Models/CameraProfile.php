<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CameraProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'partner_id',
        'name',
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
        'is_active',
    ];

    protected $casts = [
        'countdown_seconds' => 'integer',
        'burst_count' => 'integer',
        'live_view' => 'boolean',
        'version' => 'integer',
        'is_active' => 'boolean',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function snapshots(): HasMany
    {
        return $this->hasMany(CameraSnapshot::class);
    }
}