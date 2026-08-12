<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrintJob extends Model
{
    use HasFactory;

    protected $fillable = [
        'partner_id', 'photo_session_id', 'printer_id', 'printer_snapshot_id',
        'idempotency_key', 'copies', 'status', 'duration_ms', 'error_log',
        'queued_at', 'started_at', 'finished_at',
    ];

    protected $casts = [
        'copies' => 'integer',
        'duration_ms' => 'integer',
        'queued_at' => 'datetime',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function partner() { return $this->belongsTo(Partner::class); }
    public function photoSession() { return $this->belongsTo(PhotoSession::class); }
    public function printer() { return $this->belongsTo(Printer::class); }
    public function printerSnapshot() { return $this->belongsTo(PrinterSnapshot::class); }
}
