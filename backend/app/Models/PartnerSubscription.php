<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PartnerSubscription extends Model
{
    use HasFactory;

    protected $fillable = [

        'partner_id',
        'subscription_plan_id',
        'status',
        'starts_at',
        'ends_at',
        'auto_renew',
        'cancelled_at',

    ];

    protected function casts(): array
    {
        return [

            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'auto_renew' => 'boolean',

        ];
    }

    public function partner()
    {
        return $this->belongsTo(
            Partner::class
        );
    }

    public function subscriptionPlan()
    {
        return $this->belongsTo(
            SubscriptionPlan::class
        );
    }

    public function scopeActive($query)
    {
        return $query->where(
            'status',
            'active'
        );
    }

    public function scopeCurrent($query)
    {
        return $query
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->where('status', 'active');
    }
}