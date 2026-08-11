<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DownloadToken extends Model
{
    protected $fillable = [
        'photo_session_id',
        'token',
        'download_count',
        'share_count',
        'expires_at',
        'last_download_at',
    ];

    protected $casts = [
        'download_count' => 'integer',
        'share_count' => 'integer',
        'expires_at' => 'datetime',
        'last_download_at' => 'datetime',
    ];

    public function photoSession()
    {
        return $this->belongsTo(PhotoSession::class);
    }
}
