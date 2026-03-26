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
use App\Models\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// مسارات عامة (لا تحتاج تسجيل دخول)
Route::prefix('v1/auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// مسارات محمية (تحتاج توكن Sanctum)
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {

    // 1. المصادقة (Authentication)
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // 2. الملفات الشخصية (Profiles)
    Route::post('/profile/student', [ProfileController::class, 'completeStudentProfile']);
    Route::get('/profile/teacher', [ProfileController::class, 'getTeacherProfile']);
    Route::post('/profile/teacher', [ProfileController::class, 'completeTeacherProfile']);

    // 3. المحفظة والمالية وطلبات السحب (Wallet & Payouts)
    Route::get('/wallet', [WalletController::class, 'index']);
    Route::get('/wallet/payouts', [PayoutRequestController::class, 'index']); // 👈 تم التحديث ليطابق الواجهة الأمامية
    Route::post('/wallet/payouts', [PayoutRequestController::class, 'store']); // 👈 تم التحديث ليطابق الواجهة الأمامية

    // 4. الحجوزات وإدارة الحصص (Bookings & Classes)
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/{id}/classroom', [ClassroomController::class, 'getAccessDetails']);
    Route::patch('/bookings/{id}/complete', [BookingController::class, 'complete']);
    Route::patch('/bookings/{id}/cancel', [BookingController::class, 'cancel']);

    // 5. التقييمات (Reviews)
    Route::post('/reviews', [ReviewController::class, 'store']);

    // 6. إدارة جدول مواعيد المعلم (Teacher Slots)
    Route::get('/teacher/slots', [TeacherSlotController::class, 'index']);
    Route::post('/teacher/slots', [TeacherSlotController::class, 'store']);
    Route::delete('/teacher/slots/{id}', [TeacherSlotController::class, 'destroy']);

    // 7. إدارة الأبناء (لولي الأمر) (Parent Management)
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

    // 9. نظام التذاكر والدعم الفني
    Route::post('/support-tickets', function (Request $request) {
        $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'booking_id' => 'nullable|exists:bookings,id',
        ]);

        $ticket = SupportTicket::create([
            'user_id' => $request->user()->id,
            'booking_id' => $request->booking_id,
            'subject' => $request->subject,
            'description' => $request->description,
            'status' => 'open',
        ]);

        return response()->json(['status' => 'success', 'message' => 'تم استلام تذكرتك بنجاح، سيقوم فريق الدعم بمراجعتها والرد عليك قريباً.']);
    });

    // جلب تذاكر المستخدم لعرضها له
    Route::get('/support-tickets', function (Request $request) {
        return response()->json([
            'data' => SupportTicket::where('user_id', $request->user()->id)->latest()->get(),
        ]);
    });

});

// مسارات التصفح والبحث (عامة)
Route::prefix('v1/discovery')->group(function () {
    Route::get('/subjects', [DiscoveryController::class, 'subjects']);
    Route::get('/grade-levels', [DiscoveryController::class, 'gradeLevels']);
    Route::get('/teachers', [DiscoveryController::class, 'teachers']);
    Route::get('/teachers/{id}/slots', [DiscoveryController::class, 'teacherSlots']);

    // // مسار استقبال إشعارات الدفع (Webhooks) من البنك
    // Route::post('/webhooks/payment', [PaymentController::class, 'webhook']);

    // مسارات عامة (لا تتطلب تسجيل دخول)
    Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);
    // Route::post('/register/teacher', [\App\Http\Controllers\Api\AuthController::class, 'registerTeacher']);

    // مسار لجلب المواد الدراسية النشطة لقائمة التسجيل
    Route::get('/public/subjects', function () {
        return response()->json([
            'data' => \App\Models\Subject::where('is_active', true)->get(),
        ]);
    });

});

// مسارات عامة (V1)
Route::prefix('v1')->group(function () {
    Route::post('/webhooks/payment', [PaymentController::class, 'webhook']);
});
