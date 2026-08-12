<?php

namespace App\Services;

use App\Models\Device;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthService
{
    public function login(array $data, $ip)
    {
        $device = null;

        $user = User::with([
            'role',
            'partner',
        ])
            ->where('email', $data['email'])
            ->first();

        if (! $user) {

            return [
                'success' => false,
                'message' => 'Email tidak ditemukan',
            ];

        }

        if (! Hash::check($data['password'], $user->password)) {

            return [
                'success' => false,
                'message' => 'Password salah',
            ];

        }

        if ($user->status != 'active') {

            return [
                'success' => false,
                'message' => 'User tidak aktif',
            ];

        }

        if (! empty($data['device_uuid'])) {
            $device = Device::query()
                ->where('device_uuid', $data['device_uuid'])
                ->where('status', 'active')
                ->first();

            if (! $device) {
                return [
                    'success' => false,
                    'message' => 'Device aktif tidak ditemukan.',
                ];
            }

            if ($device->partner_id !== $user->partner_id) {
                return [
                    'success' => false,
                    'message' => 'Akun operator tidak terdaftar pada partner device ini.',
                ];
            }
        }

        $now = now();
        $tokenName = empty($data['device_uuid'])
            ? 'web'
            : 'desktop:'.Str::lower($data['device_uuid']);
        $user->tokens()->where('name', $tokenName)->delete();
        $expirationMinutes = max(1, (int) config('sanctum.expiration', 1440));
        $token = $user->createToken(
            $tokenName,
            ['*'],
            now()->addMinutes($expirationMinutes)
        )->plainTextToken;

        $user->update([
            'last_login_at' => $now,
            'last_login_ip' => $ip,
        ]);

        $device?->update([
            'last_login_at' => $now,
            'last_sync_at' => $now,
        ]);

        return [

            'success' => true,

            'message' => 'Login berhasil',

            'token' => $token,

            'user' => $user,

        ];

    }
}
