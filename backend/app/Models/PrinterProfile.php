<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PrinterProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'partner_id',
        'printer_name',
        'copies',
        'paper_size',
        'orientation',
        'auto_print',
        'border',
        'bleed',
        'delay_ms',
        'version',
        'is_active',
    ];

    protected $casts = [
        'copies' => 'integer',
        'auto_print' => 'boolean',
        'border' => 'boolean',
        'bleed' => 'decimal:2',
        'delay_ms' => 'integer',
        'version' => 'integer',
        'is_active' => 'boolean',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function snapshots(): HasMany
    {
        return $this->hasMany(PrinterSnapshot::class);
    }
}