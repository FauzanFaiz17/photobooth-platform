<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PhotoSession extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'partner_id',
        'booth_id',
        'event_id',
        'device_id',
        'operator_id',
        'customer_id',
        'payment_id',
        'download_token',
        'status',
        'started_at',
        'completed_at'];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function booth()
    {
        return $this->belongsTo(Booth::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    public function operator()
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function media()
    {
        return $this->hasMany(Media::class);
    }

    public function downloadAccess()
    {
        return $this->hasOne(DownloadToken::class);
    }

    public function galleryViews()
    {
        return $this->hasMany(GalleryView::class);
    }
}
