<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    protected $fillable = [
        'partner_id',
        'voucher_package_id',
        'code',
        'idempotency_key',
        'status',
        'usage_limit',
        'usage_count',
        'expired_at',
        'generated_by',
        'redeemed_by',
        'redeemed_at',
    ];

    protected $casts = [
        'expired_at' => 'datetime',
        'redeemed_at' => 'datetime',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function package()
    {
        return $this->belongsTo(VoucherPackage::class, 'voucher_package_id');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function redemptions()
    {
        return $this->hasMany(VoucherRedemption::class);
    }

    public function generatedBy()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function redeemedBy()
    {
        return $this->belongsTo(User::class, 'redeemed_by');
    }
}
