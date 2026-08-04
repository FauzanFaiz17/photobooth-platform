<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrinterSnapshot extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'printer_profile_id',
        'printer_name',
        'copies',
        'paper_size',
        'orientation',
        'auto_print',
        'border',
        'bleed',
        'delay_ms',
        'version',
        'created_at',
    ];

    protected $casts = [
        'copies' => 'integer',
        'auto_print' => 'boolean',
        'border' => 'boolean',
        'bleed' => 'decimal:2',
        'delay_ms' => 'integer',
        'version' => 'integer',
        'created_at' => 'datetime',
    ];

    public function printerProfile(): BelongsTo
    {
        return $this->belongsTo(PrinterProfile::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }
}