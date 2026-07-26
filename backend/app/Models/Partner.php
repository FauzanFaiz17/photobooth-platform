<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
class Partner extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_name',
        'brand_name',
        'slug',
        'address',
        'phone',
        'email',
        'tax_number',
        'logo_path',
        'status'
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
