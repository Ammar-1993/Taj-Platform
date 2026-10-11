<?php

namespace App\Providers;

use App\Support\CustomLostConnectionDetector;
use App\Support\CustomPredisConnector;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Database\LostConnectionDetector;
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
        // 🔄 تسجيل CustomLostConnectionDetector لدعم التعرف على انقطاع اتصال Redis/Predis لإنهاء العامل وإعادة تشغيله بنظافة
        $this->app->singleton(
            LostConnectionDetector::class,
            CustomLostConnectionDetector::class
        );
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

        // ⚡ تهيئة مشغل Predis بدعم إعادة المحاولة التلقائية (Retry Backoff) لمنع أخطاء Stream is already at the end
        if ($this->app->bound('redis')) {
            $this->app->make('redis')->extend('predis', fn () => new CustomPredisConnector);
        }
    }
}
