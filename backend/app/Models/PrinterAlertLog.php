<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrinterAlertLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'alert_setting_id',
        'recipient_email',
        'remaining_prints',
        'channel',
        'sent_at',
    ];

    protected $casts = [
        'remaining_prints' => 'integer',
        'sent_at' => 'datetime',
    ];

    public function alertSetting(): BelongsTo
    {
        return $this->belongsTo(PrinterAlertSetting::class, 'alert_setting_id');
    }
}
