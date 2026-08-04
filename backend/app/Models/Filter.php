<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Filter extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'partner_id',
        'name',
        'lut_path',
        'brightness',
        'contrast',
        'saturation',
        'sharpness',
        'white_balance',
        'intensity',
        'version',
        'is_active',
    ];

    protected $casts = [
        'brightness' => 'decimal:2',
        'contrast' => 'decimal:2',
        'saturation' => 'decimal:2',
        'sharpness' => 'decimal:2',
        'white_balance' => 'decimal:2',
        'intensity' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function snapshots(): HasMany
    {
        return $this->hasMany(FilterSnapshot::class);
    }
}