<?php

namespace App\Http\Resources\Desktop;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

use App\Http\Resources\UserResource;
use App\Http\Resources\DeviceResource;
use App\Http\Resources\PartnerResource;
use App\Http\Resources\BoothResource;

class BootstrapResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'user' => new UserResource(
                $this['user']
            ),

            'device' => $this['device']
                ? new DeviceResource(
                    $this['device']
                )
                : null,

            'partner' => $this['partner']
                ? new PartnerResource(
                    $this['partner']
                )
                : null,

            'booth' => $this['booth']
                ? new BoothResource(
                    $this['booth']
                )
                : null,

            'application' => $this['application'],

            'server' => $this['server'],

        ];
    }
}