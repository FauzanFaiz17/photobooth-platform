<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PrinterAlertSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'printer_id',
        'total_print_limit',
        'low_stock_threshold',
        'is_active',
        'last_notified_at',
    ];

    protected $casts = [
        'total_print_limit' => 'integer',
        'low_stock_threshold' => 'integer',
        'is_active' => 'boolean',
        'last_notified_at' => 'datetime',
    ];

    public function printer(): BelongsTo
    {
        return $this->belongsTo(Printer::class);
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(PrinterAlertRecipient::class, 'alert_setting_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(PrinterAlertLog::class, 'alert_setting_id');
    }
}
