<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Template extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'partner_id',
        'name',
        'paper_size',
        'preview_path',
        'thumbnail_path',
        'json_layout',
        'psd_path',
        'png_path',
        'version',
        'status',
    ];

    protected $casts = [
        'json_layout' => 'array',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    public function snapshots(): HasMany
    {
        return $this->hasMany(TemplateSnapshot::class);
    }
}
