<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PartnerMonthlyReport extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [

        'partner_id',
        'period_year',
        'period_month',
        'total_revenue',
        'total_sessions',
        'total_customers',
        'total_vouchers_used',
        'total_qris_transactions',
        'total_prints',
        'total_downloads',
        'total_media',
        'generated_at',

    ];

    protected function casts(): array
    {
        return [

            'generated_at' => 'datetime',
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