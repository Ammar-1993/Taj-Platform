<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Number;
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
        // 🔢 استخدام الأرقام الإنجليزية (Western) في جميع الأرقام والعملات
        Number::useLocale('en');

        if (env('APP_ENV') === 'production') {
            URL::forceScheme('https');
        }

        ResetPassword::createUrlUsing(function ($user, string $token) {
            return env('FRONTEND_URL', config('app.url')).'/reset-password?token='.urlencode($token).'&email='.urlencode($user->email);
        });

        // تقييد عام للـ API: 60 طلب في الدقيقة لكل IP
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // 🛑 تقييد صارم لمحاولات تسجيل الدخول (5 محاولات فقط كل دقيقة)
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });
    }
}
