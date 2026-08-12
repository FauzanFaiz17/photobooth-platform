<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Booth extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'partner_id',
        'name',
        'location',
        'status'
    ];

    public function partner()
    {
        return $this->belongsTo(
            Partner::class
        );
    }

    public function devices()
    {
        return $this->hasMany(
            Device::class
        );
    }

    public function activeDevices()
    {
        return $this->devices()
            ->where('status', 'active');
    }

    public function printers()
    {
        return $this->hasMany(Printer::class);
    }
}
