<?php

namespace App\Providers;

use App\Models\CameraProfile;
use App\Models\Device;
use App\Models\Event;
use App\Models\Filter;
use App\Models\Partner;
use App\Models\PrinterProfile;
use App\Models\Template;
use App\Models\User;
use App\Policies\CameraProfilePolicy;
use App\Policies\DevicePolicy;
use App\Policies\EventPolicy;
use App\Policies\FilterPolicy;
use App\Policies\PartnerPolicy;
use App\Policies\PrinterProfilePolicy;
use App\Policies\TemplatePolicy;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(
            User::class,
            UserPolicy::class
        );

        Gate::policy(
            Partner::class,
            PartnerPolicy::class
        );

        Gate::policy(
            Event::class,
            EventPolicy::class
        );

        Gate::policy(Device::class, DevicePolicy::class);

        Gate::policy(Template::class, TemplatePolicy::class);
        Gate::policy(Filter::class, FilterPolicy::class);
        Gate::policy(CameraProfile::class, CameraProfilePolicy::class);
        Gate::policy(PrinterProfile::class, PrinterProfilePolicy::class);
    }
}
