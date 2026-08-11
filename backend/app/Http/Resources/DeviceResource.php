<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeviceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'device_key' => $this->device_key,
            'device_uuid' => $this->device_uuid,
            'device_name' => $this->device_name,

            'status' => $this->status,

            'activation_expires_at' => $this->activation_expires_at,

            'activated_at' => $this->activated_at,

            'app_version' => $this->app_version,

            'last_sync_at' => $this->last_sync_at,

            'last_login_at' => $this->last_login_at,

            'partner' => $this->partner ? [
                'id' => $this->partner->id,
                'company_name' => $this->partner->company_name,
            ] : null,

            'booth' => $this->booth ? [
                'id' => $this->booth->id,
                'name' => $this->booth->name,
            ] : null,
        ];
    }
}
