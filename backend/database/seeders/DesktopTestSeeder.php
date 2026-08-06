<?php
namespace Database\Seeders;
use App\Models\Booth; 
use App\Models\Device; 
use App\Models\Partner; 
use App\Models\Role; 
use App\Models\User; 
use Illuminate\Database\Seeder; 
use Illuminate\Support\Facades\Hash;


class DesktopTestSeeder extends Seeder { 
    public function run(): void { 
        $partner=Partner::updateOrCreate(
            ['slug'=>'desktop-test-partner'],
            [
                'company_name'=>'Desktop Test Partner',
                'brand_name'=>'Desktop Test',
                'email'=>'desktop-test@example.com',
                'status'=>'active'
            ]
        );
        $role = Role::where('slug', 'operator')->firstOrFail();
        $booth = Booth::updateOrCreate(
            ['partner_id' => $partner->id, 'name' => 'Desktop Test Booth'],
            ['location' => 'Local Development', 'status' => 'active']
        );
        $user = User::updateOrCreate(
            ['email' => 'operator@photobooth.test'],
            [
                'partner_id' => $partner->id,
                'role_id' => $role->id,
                'name' => 'Desktop Test Operator',
                'password' => Hash::make('Operator@12345'),
                'phone' => '0800000000',
                'status' => 'active',
                'email_verified_at' => now()
            ]
        );
        $uuid = env('TEST_DEVICE_UUID', '11111111-1111-4111-8111-111111111111');
        $device = Device::updateOrCreate(
            ['device_uuid' => $uuid],
            [
                'partner_id' => $partner->id,
                'booth_id' => $booth->id,
                'device_key' => 'desktop-test-device',
                'device_name' => 'Desktop Test Device',
                'windows_uuid' => 'test-windows-uuid',
                'cpu_identifier' => 'test-cpu',
                'mac_address' => '00:00:00:00:00:01',
                'app_version' => '1.0.0',
                'status' => 'active'
            ]
        );
        $this->command?->info('Desktop test data ready.');
        $this->command?->line('Email: operator@photobooth.test');
        $this->command?->line('Password: Operator@12345');
        $this->command?->line('Device UUID: '.$device->device_uuid);
        $this->command?->line('Partner ID: '.$partner->id.' | Booth ID: '.$booth->id.' | User ID: '.$user->id);
    }
}