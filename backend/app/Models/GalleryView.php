<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GalleryView extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'photo_session_id',
        'ip_address',
        'user_agent',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];

    public function photoSession()
    {
        return $this->belongsTo(PhotoSession::class);
    }
}
