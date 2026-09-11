<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->report(function (\Throwable $e) {
            // تجاهل أخطاء TypeError الناتجة عن تلاعب البوتات بحالة Livewire
            if ($e instanceof \TypeError && str_contains($e->getMessage(), 'BasePage::getInfolist(): Argument #1')) {
                return false;
            }

            // تجاهل محاولات تعديل الخصائص المحمية (Locked Properties) بواسطة أدوات الفحص
            if ($e instanceof \Livewire\Features\SupportLockedProperties\CannotUpdateLockedPropertyException) {
                return false;
            }

            if (app()->bound('sentry')) {
                \Sentry\captureException($e);
            }
        });
    })->create();
