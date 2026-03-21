<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ClassroomController;
use App\Http\Controllers\Api\DiscoveryController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ParentController;


// مسارات عامة (لا تحتاج تسجيل دخول)
Route::prefix('v1/auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// مسارات محمية (تحتاج توكن Sanctum)
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {

    // المصادقة
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // الملفات الشخصية
    Route::post('/profile/teacher', [ProfileController::class, 'completeTeacherProfile']);
    Route::post('/profile/student', [ProfileController::class, 'completeStudentProfile']);

    // المحفظة والمالية
    Route::get('/wallet', [WalletController::class, 'index']);

    // الحجوزات
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'store']);

    // مسار دخول الفصل الافتراضي
    Route::get('/bookings/{id}/classroom', [ClassroomController::class, 'getAccessDetails']);

    Route::patch('/bookings/{id}/complete', [BookingController::class, 'complete']);

    Route::post('/wallet/payouts', [WalletController::class, 'requestPayout']);


    // مسارات إدارة الأبناء (لولي الأمر)
    Route::get('/parent/children', [ParentController::class, 'getChildren']);
    Route::post('/parent/children', [ParentController::class, 'storeChild']);
    Route::put('/parent/children/{id}', [ParentController::class, 'updateChild']);


    Route::patch('/parent/children/{id}/toggle-permission', [ParentController::class, 'toggleBookingPermission']);
});

// مسارات التصفح والبحث (عامة)
Route::prefix('v1/discovery')->group(function () {
    Route::get('/subjects', [DiscoveryController::class, 'subjects']);
    Route::get('/grade-levels', [DiscoveryController::class, 'gradeLevels']);
    Route::get('/teachers', [DiscoveryController::class, 'teachers']);
    Route::get('/teachers/{id}/slots', [DiscoveryController::class, 'teacherSlots']);

    // // مسار استقبال إشعارات الدفع (Webhooks) من البنك
    // Route::post('/webhooks/payment', [PaymentController::class, 'webhook']);
});

// مسارات عامة (V1)
Route::prefix('v1')->group(function () {
    Route::post('/webhooks/payment', [\App\Http\Controllers\Api\PaymentController::class, 'webhook']);
});
