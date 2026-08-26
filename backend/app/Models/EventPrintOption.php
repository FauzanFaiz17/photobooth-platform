<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventPrintOption extends Model
{
    protected $fillable = ['event_id', 'paper_size', 'unit_quantity', 'quantity_step', 'price', 'is_active'];

    protected $casts = ['unit_quantity' => 'integer', 'quantity_step' => 'integer', 'price' => 'decimal:2', 'is_active' => 'boolean'];

    public function event(): BelongsTo { return $this->belongsTo(Event::class); }
}
