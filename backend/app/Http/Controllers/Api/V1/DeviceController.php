<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function verify(Request $request)
    {
        $device = Device::where(
            'device_uuid',
            $request->device_uuid
        )->first();

        if (!$device) {

            return response()->json([

                'success' => false,

                'registered' => false,

                'message' => 'Perangkat belum terdaftar.'

            ],404);

        }

        if($device->status!='active'){

            return response()->json([

                'success'=>false,

                'registered'=>true,

                'message'=>'Perangkat tidak aktif.'

            ],403);

        }

        return response()->json([

            'success'=>true,

            'registered'=>true,

            'device'=>$device

        ]);

    }
}
