<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ClassroomController;
use App\Http\Controllers\Api\DiscoveryController;
use App\Http\Controllers\Api\ParentController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\TeacherSlotController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\PayoutRequestController;
use App\Models\Subject;
use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (Version 1)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ==========================================
    // مسارات غير محمية (Public Routes)
    // ==========================================

    // 1. المصادقة (Auth)
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);

        // 🟢 التعديل الأمني هنا: إضافة throttle:login لتقييد محاولات الدخول الخاطئة
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
    });

    // 2. التصفح والاكتشاف (Discovery)
    Route::prefix('discovery')->group(function () {
        Route::get('/subjects', [DiscoveryController::class, 'subjects']);
        Route::get('/grade-levels', [DiscoveryController::class, 'gradeLevels']);
        Route::get('/teachers', [DiscoveryController::class, 'teachers']);
        Route::get('/teachers/{id}/slots', [DiscoveryController::class, 'teacherSlots']);
        Route::get('/teachers/{id}/reviews', [DiscoveryController::class, 'teacherReviews']);
    });

    // 3. مسارات عامة أخرى
    Route::get('/public/subjects', function () {
        return response()->json([
            'data' => Subject::where('is_active', true)->get(),
        ]);
    });
    Route::post('/webhooks/payment', [PaymentController::class, 'webhook']);

    // ==========================================
    // مسارات محمية (Protected Routes) - تتطلب Sanctum Token
    // ==========================================
    Route::middleware('auth:sanctum')->group(function () {

        // 1. المصادقة والجلسة (Auth Session)
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::put('/auth/me', [AuthController::class, 'updateUser']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // 2. الملفات الشخصية (Profiles)
        Route::post('/profile/student', [ProfileController::class, 'completeStudentProfile']);
        Route::get('/profile/teacher', [ProfileController::class, 'getTeacherProfile']);
        Route::post('/profile/teacher', [ProfileController::class, 'completeTeacherProfile']);

        // 3. المحفظة والمالية (Wallet & Payouts)
        Route::get('/wallet', [WalletController::class, 'index']);
        Route::get('/wallet/payouts', [PayoutRequestController::class, 'index']);
        Route::post('/wallet/payouts', [PayoutRequestController::class, 'store']);
        Route::post('/payments/create', [PaymentController::class, 'create']);
        Route::post('/payments/verify', [PaymentController::class, 'verify']);

        // 4. الحجوزات والحصص (Bookings)
        Route::get('/bookings', [BookingController::class, 'index']);
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::get('/bookings/{id}/classroom', [ClassroomController::class, 'getAccessDetails']);
        Route::patch('/bookings/{id}/complete', [BookingController::class, 'complete']);
        Route::patch('/bookings/{id}/cancel', [BookingController::class, 'cancel']);

        // 5. التقييمات (Reviews)
        Route::post('/reviews', [ReviewController::class, 'store']);

        // 6. إدارة جدول المعلم (Teacher Slots)
        Route::get('/teacher/slots', [TeacherSlotController::class, 'index']);
        Route::post('/teacher/slots', [TeacherSlotController::class, 'store']);
        Route::delete('/teacher/slots/{id}', [TeacherSlotController::class, 'destroy']);

        // 7. إدارة الأبناء لولي الأمر (Parent Management)
        Route::get('/parent/children', [ParentController::class, 'getChildren']);
        Route::post('/parent/children', [ParentController::class, 'storeChild']);
        Route::put('/parent/children/{id}', [ParentController::class, 'updateChild']);
        Route::patch('/parent/children/{id}/toggle-permission', [ParentController::class, 'toggleBookingPermission']);
        Route::get('/parent/dashboard', [ParentController::class, 'getDashboardData']);

        // 8. الإشعارات (Notifications)
        Route::get('/notifications', function (Request $request) {
            return response()->json(['data' => $request->user()->unreadNotifications]);
        });
        Route::post('/notifications/{id}/read', function (Request $request, $id) {
            $request->user()->notifications()->findOrFail($id)->markAsRead();

            return response()->json(['status' => 'success']);
        });

        // 9. الدعم الفني (Support Tickets)
        Route::post('/support-tickets', function (Request $request) {
            $request->validate([
                'subject' => 'required|string|max:255',
                'description' => 'required|string',
                'booking_id' => 'nullable|exists:bookings,id',
            ]);

            SupportTicket::create([
                'user_id' => $request->user()->id,
                'booking_id' => $request->booking_id,
                'subject' => $request->subject,
                'description' => $request->description,
                'status' => 'open',
            ]);

            return response()->json(['status' => 'success', 'message' => 'تم استلام تذكرتك بنجاح، سيقوم فريق الدعم بمراجعتها والرد عليك قريباً.']);
        });

        Route::get('/support-tickets', function (Request $request) {
            $tickets = SupportTicket::where('user_id', $request->user()->id)
                ->latest()
                ->paginate(10);

            return response()->json([
                'status' => 'success',
                'data' => $tickets,
            ]);
        });

    }); // نهاية مجموعة auth:sanctum

}); // نهاية مجموعة v1
