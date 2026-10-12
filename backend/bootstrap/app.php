<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Livewire\Features\SupportLockedProperties\CannotUpdateLockedPropertyException;
use Predis\Connection\ConnectionException;
use Predis\Connection\Resource\Exception\StreamInitException;

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
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->is('api/*') || $request->is('api') || $request->expectsJson()) {
                return null;
            }

            if ($request->is('admin/*') || $request->is('admin')) {
                return route('filament.admin.auth.login');
            }

            return route('login');
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $e) {
            if ($request->is('api/*') || $request->is('api')) {
                return true;
            }

            return $request->expectsJson();
        });

        $exceptions->report(function (Throwable $e) {
            // تجاهل أخطاء TypeError الناتجة عن تلاعب البوتات وأدوات الفحص بحالة ومكونات Livewire
            if ($e instanceof TypeError && (
                str_contains($e->getMessage(), 'Cannot assign') ||
                str_contains($e->getMessage(), 'BasePage::getInfolist') ||
                str_contains($e->getFile(), '/livewire/')
            )) {
                return false;
            }

            // تجاهل محاولات تعديل الخصائص المحمية (Locked Properties) بواسطة أدوات الفحص
            if ($e instanceof CannotUpdateLockedPropertyException) {
                return false;
            }

            // تجاهل انقطاعات اتصال واستعلامات Redis/Predis العابرة أثناء إعادة تشغيل الحاوية أو عمليات النشر
            if (($e instanceof ConnectionException || $e instanceof StreamInitException) && (
                str_contains($e->getMessage(), 'Stream is already at the end') ||
                str_contains($e->getMessage(), 'Connection refused') ||
                str_contains($e->getMessage(), 'Temporary failure in name resolution') ||
                str_contains($e->getMessage(), 'php_network_getaddresses')
            )) {
                return false;
            }

            if (app()->bound('sentry')) {
                \Sentry\captureException($e);
            }
        });
    })->create();
