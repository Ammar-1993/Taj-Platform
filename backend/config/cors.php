<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // 🟢 التعديل الأمني 1: السماح فقط للواجهة الأمامية الخاصة بك بالاتصال بالخادم
    // في بيئة التطوير سيعمل على localhost:3000، وفي الإنتاج سيأخذ الرابط من ملف .env
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
        'https://taj-platform.vercel.app', // الرابط القديم لضمان استمراريته
        'https://taj-edu.online',          // الدومين الجديد
        'https://www.taj-edu.online',      // الدومين الجديد مع www
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // 🟢 التعديل الأمني 2: تفعيل دعم الكوكيز والمصادقة الجلسات (ضروري جداً لعمل Sanctum)
    'supports_credentials' => true,

];
