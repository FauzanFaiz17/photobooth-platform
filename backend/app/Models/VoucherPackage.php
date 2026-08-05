<?php


namespace App\Models; 
use Illuminate\Database\Eloquent\Model; 
use Illuminate\Database\Eloquent\SoftDeletes;

class VoucherPackage extends Model { 
    use SoftDeletes; 
    protected $fillable=[
        'partner_id',
        'name',
        'price',
        'persons',
        'captures',
        'print_count',
        'gif_included',
        'video_included',
        'template_id',
        'validity_days',
        'is_active'
    ]; 
    
    protected $casts=[
        'price'=>'decimal:2',
        'gif_included'=>'boolean',
        'video_included'=>'boolean',
        'is_active'=>'boolean'
    ]; 
    public function partner(){
        return $this->belongsTo(Partner::class);
    }

    public function vouchers(){
        return $this->hasMany(Voucher::class);
    }

    public function template(){
        return $this->belongsTo(Template::class);
    }
}