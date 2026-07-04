<?php

return [
    'dsn'         => env('SENTRY_LARAVEL_DSN', env('SENTRY_DSN')),
    'environment' => env('APP_ENV', 'production'),

    'breadcrumbs' => [
        'logs'                 => true,
        'cache'                => true,
        'sql_queries'          => true,
        'sql_bindings'         => false,
        'queue_info'           => true,
        'command_info'         => true,
        'http_client_requests' => true,
        'send_default_pii'     => false,
    ],

    'tracing' => [
        'queue_job_transactions' => true,
        'queue_jobs'             => true,
        'sql_queries'            => true,
        'http_client_requests'   => true,
        'default_integrations'   => true,
    ],

    'traces_sample_rate'   => (float) env('SENTRY_TRACES_SAMPLE_RATE', 0.2),
    'profiles_sample_rate' => (float) env('SENTRY_PROFILES_SAMPLE_RATE', 0.1),

    // تفعيل ميزة إرسال Logs إلى Sentry (يتطلب sentry/sentry-laravel >= 4.15)
    'enable_logs' => env('SENTRY_ENABLE_LOGS', false),
];
