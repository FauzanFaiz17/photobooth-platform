<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'partner_id',
        'booth_id',
        'created_by',

        'event_name',
        'event_code',

        'template_snapshot_id',
        'filter_snapshot_id',
        'camera_snapshot_id',
        'printer_snapshot_id',

        'event_date',
        'start_time',
        'end_time',

        'price',
        'print_count_limit',

        'status',
    ];

    protected $casts = [
        'event_date' => 'date',
        'start_time' => 'datetime:H:i:s',
        'end_time' => 'datetime:H:i:s',
        'price' => 'decimal:2',
        'print_count_limit' => 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function booth(): BelongsTo
    {
        return $this->belongsTo(Booth::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function templateSnapshot(): BelongsTo
    {
        return $this->belongsTo(
            TemplateSnapshot::class,
            'template_snapshot_id'
        );
    }

    public function filterSnapshot(): BelongsTo
    {
        return $this->belongsTo(
            FilterSnapshot::class,
            'filter_snapshot_id'
        );
    }

    public function cameraSnapshot(): BelongsTo
    {
        return $this->belongsTo(
            CameraSnapshot::class,
            'camera_snapshot_id'
        );
    }

    public function printerSnapshot(): BelongsTo
    {
        return $this->belongsTo(
            PrinterSnapshot::class,
            'printer_snapshot_id'
        );
    }

    public function photoSessions(): HasMany
    {
        return $this->hasMany(PhotoSession::class);
    }

    public function templateSnapshots(): BelongsToMany
    {
        return $this->belongsToMany(TemplateSnapshot::class, 'event_templates')
            ->withPivot(['sort_order', 'is_default'])->withTimestamps()->orderBy('sort_order');
    }

    public function filterSnapshots(): BelongsToMany
    {
        return $this->belongsToMany(FilterSnapshot::class, 'event_filters')
            ->withPivot(['sort_order', 'is_default'])->withTimestamps()->orderBy('sort_order');
    }

    public function printOptions(): HasMany
    {
        return $this->hasMany(EventPrintOption::class);
    }
}
