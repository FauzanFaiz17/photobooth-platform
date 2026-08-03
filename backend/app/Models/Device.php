<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Device extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'partner_id',
        'booth_id',
        'device_key',
        'device_uuid',
        'device_name',
        'windows_uuid',
        'cpu_identifier',
        'mac_address',
        'app_version',
        'last_sync_at',
        'last_login_at',
        'status'
    ];

    protected function casts(): array
    {
        return [

            'last_sync_at' => 'datetime',

            'last_login_at' => 'datetime',

        ];
    }

    public function partner()
    {
        return $this->belongsTo(
            Partner::class
        );
    }

    public function booth()
    {
        return $this->belongsTo(
            Booth::class
        );
    }
}