<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;


#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'partner_id',
        'role_id',
        'name',
        'email',
        'password',
        'phone',
        'avatar_path',
        'status',
        'last_login_at',
        'last_login_ip',
    ];
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    public function hasPermission(string $permission): bool
    {
        return $this->role?->permissions
            ->contains('slug', $permission) ?? false;
    }

    public function isSuperAdmin(): bool
    {
        return $this->role?->slug === 'super-admin';
    }

    public function roleLevel(): int
    {
        return $this->role?->level ?? 0;
    }

    public function canManageRole(Role $role): bool
    {
        return $this->roleLevel() > $role->level;
    }

    public function hasRole(string $role): bool
    {
        return $this->role?->slug === $role;
    }

    public function isPartner(): bool
    {
        return !is_null($this->partner_id);
    }

    public function belongsToPartner(int $partnerId): bool
    {
        return $this->partner_id === $partnerId;
    }

    public function canManageUser(User $target): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        if (!$this->belongsToPartner($target->partner_id)) {
            return false;
        }

        return $this->roleLevel() > $target->roleLevel();
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByPartner($query, $partnerId)
    {
        return $query->where('partner_id', $partnerId);
    }

    public function scopeSearch($query, $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('name', 'like', "%{$keyword}%")
            ->orWhere('email', 'like', "%{$keyword}%");
        });
    }

    public function getAvatarUrlAttribute(): ?string
    {
        return $this->avatar_path
            ? asset('storage/' . $this->avatar_path)
            : null;
    }
}
