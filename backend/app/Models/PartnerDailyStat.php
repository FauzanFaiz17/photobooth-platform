<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PartnerDailyStat extends Model
{
    use HasFactory;

    protected $fillable = [

        'partner_id',
        'stat_date',
        'total_revenue',
        'total_sessions',
        'total_customers',
        'total_prints',
        'total_downloads',

    ];

    protected function casts(): array
    {
        return [

            'stat_date' => 'date',
            'total_revenue' => 'decimal:2',

        ];
    }

    public function partner()
    {
        return $this->belongsTo(
            Partner::class
        );
    }
}