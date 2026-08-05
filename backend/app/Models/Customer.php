<?php
namespace App\Models; 

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model { 
    use SoftDeletes; 
    protected $fillable=[
        'partner_id',
        'name',
        'phone',
        'email'
        ]; 
        
    public function partner()
    {
        return $this->belongsTo(Partner::class);
    } 
    
    public function photoSessions()
    {
        return $this->hasMany(PhotoSession::class);
    } 
        
}