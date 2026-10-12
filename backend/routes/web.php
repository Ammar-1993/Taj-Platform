<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// مسار تسجيل الدخول المسمى 'login' لمنع أخطاء RouteNotFoundException وتوجيه الزوار للواجهة الأمامية
Route::get('/login', function () {
    return redirect()->away(env('FRONTEND_URL', 'https://www.taj-edu.online').'/login');
})->name('login');
