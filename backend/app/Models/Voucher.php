<?php

namespace App\Models; 
use Illuminate\Database\Eloquent\Model;

class Voucher extends Model {
     protected $fillable=[
        'partner_id',
        'voucher_package_id',
        'code',
        'status',
        'expired_at',
        'generated_by',
        'redeemed_by',
        'redeemed_at'
    ]; 
        
    protected $casts=[
        'expired_at'=>'datetime',
        'redeemed_at'=>'datetime'
    ]; 

    public function partner(){
        return $this->belongsTo(Partner::class);
    }

    public function package(){
        return $this->belongsTo(VoucherPackage::class,'voucher_package_id');
    }

    public function payment(){
        return $this->hasOne(Payment::class);
    }
}