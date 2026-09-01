<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VoucherRedemption extends Model
{
    protected $fillable = ['voucher_id', 'payment_id', 'redeemed_by', 'usage_number', 'redeemed_at'];
    protected $casts = ['redeemed_at' => 'datetime'];
    public function voucher() { return $this->belongsTo(Voucher::class); }
    public function payment() { return $this->belongsTo(Payment::class); }
}
