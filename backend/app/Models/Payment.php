<?php


namespace App\Models; 

use Illuminate\Database\Eloquent\Model;

class Payment extends Model { 
    protected $fillable=[
        'partner_id',
        'reference',
        'gateway',
        'amount',
        'fee',
        'net_amount',
        'status',
        'voucher_id',
        'expired_at',
        'paid_at',
        'gateway_response'
        ]; 
        
        protected $casts=[
            'amount'=>'decimal:2',
            'fee'=>'decimal:2',
            'net_amount'=>'decimal:2',
            'expired_at'=>'datetime',
            'paid_at'=>'datetime',
            'gateway_response'=>'array'
        ];

        public function partner(){
            return $this->belongsTo(Partner::class);
        }

        public function voucher(){
            return $this->belongsTo(Voucher::class);
        }

        public function photoSessions(){
            return $this->hasMany(PhotoSession::class);
        }
    }