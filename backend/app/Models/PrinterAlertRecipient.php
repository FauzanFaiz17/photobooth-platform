<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrinterAlertRecipient extends Model
{
    use HasFactory;

    protected $fillable = [
        'alert_setting_id',
        'email',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function alertSetting(): BelongsTo
    {
        return $this->belongsTo(PrinterAlertSetting::class, 'alert_setting_id');
    }
}
