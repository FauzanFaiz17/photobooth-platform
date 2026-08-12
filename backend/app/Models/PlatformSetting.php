<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    protected $fillable = ['key', 'encrypted_value', 'updated_by'];

    protected $hidden = ['encrypted_value'];

    protected function casts(): array
    {
        return [
            'encrypted_value' => 'encrypted:array',
        ];
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
