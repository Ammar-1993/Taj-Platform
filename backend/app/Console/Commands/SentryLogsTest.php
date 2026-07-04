<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * أمر مؤقت للتحقق من أن Sentry Logs تعمل بشكل صحيح مع الباك-إند.
 * بعد التحقق الناجح يمكن حذف هذا الملف.
 */
class SentryLogsTest extends Command
{
    protected $signature = 'sentry:test-logs';
    protected $description = 'إرسال سجلات اختبارية للتحقق من عمل Sentry Logs في taj-backend';

    public function handle(): void
    {
        $this->info('جاري إرسال السجلات إلى Sentry...');

        Log::info('Sentry Logs test from taj-backend', [
            'log_source'  => 'sentry_verify',
            'environment' => app()->environment(),
            'php_version' => PHP_VERSION,
        ]);

        Log::warning('تحذير اختبار من taj-backend', [
            'log_source' => 'sentry_verify',
        ]);

        Log::error('خطأ اختبار من taj-backend', [
            'log_source' => 'sentry_verify',
        ]);

        // إرسال مباشر لقناة sentry_logs فقط (بدون single)
        Log::channel('sentry_logs')->info('Direct Sentry channel test', [
            'log_source' => 'sentry_direct',
        ]);

        $this->info('✅ تم إرسال 4 سجلات إلى Sentry بنجاح!');
        $this->line('تحقق الآن من لوحة Sentry > Explore > Logs (بيئة: ' . app()->environment() . ')');
    }
}
