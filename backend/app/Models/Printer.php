<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Printer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'partner_id', 'booth_id', 'device_id', 'name', 'driver_name', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function partner() { return $this->belongsTo(Partner::class); }
    public function booth() { return $this->belongsTo(Booth::class); }
    public function device() { return $this->belongsTo(Device::class); }
    public function printJobs() { return $this->hasMany(PrintJob::class); }
}
