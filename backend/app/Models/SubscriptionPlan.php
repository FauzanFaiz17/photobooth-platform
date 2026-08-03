<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class SubscriptionPlan extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [

        'name',
        'price',
        'billing_cycle',
        'max_booths',
        'max_devices',
        'max_operators',
        'features',
        'is_active',

    ];

    protected function casts(): array
    {
        return [

            'price' => 'decimal:2',
            'features' => 'array',
            'is_active' => 'boolean',

        ];
    }

    public function partnerSubscriptions()
    {
        return $this->hasMany(
            PartnerSubscription::class
        );
    }
}