<?php

namespace App\Providers;

use App\Contracts\MediaStorage;
use App\Contracts\PaymentGateway;
use App\Models\CameraProfile;
use App\Models\Customer;
use App\Models\Device;
use App\Models\Event;
use App\Models\Filter;
use App\Models\Partner;
use App\Models\PartnerSubscription;
use App\Models\Payment;
use App\Models\Printer;
use App\Models\PrinterProfile;
use App\Models\PrintJob;
use App\Models\Template;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherPackage;
use App\Policies\CameraProfilePolicy;
use App\Policies\CustomerPolicy;
use App\Policies\DevicePolicy;
use App\Policies\EventPolicy;
use App\Policies\FilterPolicy;
use App\Policies\PartnerPolicy;
use App\Policies\PartnerSubscriptionPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\PrinterPolicy;
use App\Policies\PrinterProfilePolicy;
use App\Policies\PrintJobPolicy;
use App\Policies\TemplatePolicy;
use App\Policies\UserPolicy;
use App\Policies\VoucherPackagePolicy;
use App\Policies\VoucherPolicy;
use App\Services\Media\LaravelMediaStorage;
use App\Services\Payments\MidtransGateway;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PaymentGateway::class, MidtransGateway::class);
        $this->app->singleton(MediaStorage::class, LaravelMediaStorage::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request) {
            $email = Str::lower((string) $request->input('email'));

            return Limit::perMinute((int) env('LOGIN_RATE_LIMIT_PER_MINUTE', 5))
                ->by($request->ip().'|'.$email);
        });

        RateLimiter::for('device-activation', function (Request $request) {
            $code = Str::upper(trim((string) $request->input('activation_code')));

            return Limit::perMinute((int) env('ACTIVATION_RATE_LIMIT_PER_MINUTE', 5))
                ->by($request->ip().'|'.hash('sha256', $code));
        });

        Gate::policy(
            User::class,
            UserPolicy::class
        );

        Gate::policy(
            Partner::class,
            PartnerPolicy::class
        );
        Gate::policy(PartnerSubscription::class, PartnerSubscriptionPolicy::class);

        Gate::policy(
            Event::class,
            EventPolicy::class
        );

        Gate::policy(Device::class, DevicePolicy::class);
        Gate::policy(Customer::class, CustomerPolicy::class);
        Gate::policy(VoucherPackage::class, VoucherPackagePolicy::class);
        Gate::policy(Voucher::class, VoucherPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);

        Gate::policy(Template::class, TemplatePolicy::class);
        Gate::policy(Filter::class, FilterPolicy::class);
        Gate::policy(CameraProfile::class, CameraProfilePolicy::class);
        Gate::policy(PrinterProfile::class, PrinterProfilePolicy::class);
        Gate::policy(Printer::class, PrinterPolicy::class);
        Gate::policy(PrintJob::class, PrintJobPolicy::class);
    }
}
