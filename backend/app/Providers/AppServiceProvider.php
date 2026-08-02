<?php

namespace App\Providers;

use App\Models\User;
use App\Models\Partner;
use App\Policies\UserPolicy;
use App\Policies\PartnerPolicy;
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
    }
}