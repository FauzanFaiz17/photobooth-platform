<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FilterSnapshot extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'filter_id',
        'name',
        'lut_path',
        'brightness',
        'contrast',
        'saturation',
        'sharpness',
        'white_balance',
        'intensity',
        'version',
        'created_at',
    ];

    protected $casts = [
        'brightness' => 'decimal:2',
        'contrast' => 'decimal:2',
        'saturation' => 'decimal:2',
        'sharpness' => 'decimal:2',
        'white_balance' => 'decimal:2',
        'intensity' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function filter(): BelongsTo
    {
        return $this->belongsTo(Filter::class);
    }
    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }
}