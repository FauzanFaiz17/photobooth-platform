<?php

namespace App\Models; 

use Illuminate\Database\Eloquent\Model; 
use Illuminate\Database\Eloquent\SoftDeletes;

class Media extends Model { 
    use SoftDeletes; 
    protected $fillable=[
        'photo_session_id',
        'type','bucket',
        'object_key',
        'filename',
        'mime_type',
        'size_bytes',
        'checksum',
        'width',
        'height',
        'duration_seconds',
        'visibility'
        ]; 
        
        protected $casts=[
            'size_bytes'=>'integer',
            'width'=>'integer',
            'height'=>'integer',
            'duration_seconds'=>'decimal:2'
            ]; 
            
        public function photoSession()
        {
            return $this->belongsTo(PhotoSession::class);
        } 
    }