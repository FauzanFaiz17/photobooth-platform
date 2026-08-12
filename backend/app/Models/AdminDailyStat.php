<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminDailyStat extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'stat_date', 'total_partners', 'total_booths', 'total_devices', 'total_events',
        'total_sessions', 'total_payments', 'total_media', 'total_print_jobs',
        'total_uploads', 'total_downloads', 'created_at',
    ];

    protected $casts = ['stat_date' => 'date', 'created_at' => 'datetime'];
}
