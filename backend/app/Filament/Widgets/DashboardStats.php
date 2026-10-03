<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\BookingResource;
use App\Filament\Resources\PayoutRequestResource;
use App\Filament\Resources\TeacherProfileResource;
use App\Filament\Resources\UserResource;
use App\Models\Booking;
use App\Models\PayoutRequest;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class DashboardStats extends BaseWidget
{
    // ترتيب الودجت في الصفحة (رقم 1 في الأعلى)
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        // حساب إحصائيات لوحة التحكم وتخزينها مؤقتاً لتخفيف الحمل عن قاعدة البيانات
        $statsData = Cache::remember('filament_dashboard_stats', now()->addMinutes(5), function () {
            return [
                'student_count' => User::role('student')->count(),
                'teacher_count' => User::role('teacher')->count(),
                'total_revenue' => (float) (Booking::where('status', 'completed')->sum('net_paid') * 0.20),
                'pending_payouts' => PayoutRequest::where('status', 'pending')->count(),
            ];
        });

        // بيانات النمو لأرباح المنصة آخر 7 أيام
        $dailySums = Cache::remember('dashboard_daily_completed_sums', now()->addMinutes(5), function () {
            return Booking::where('status', 'completed')
                ->whereBetween('booking_date', [
                    Carbon::now()->subDays(6)->startOfDay(),
                    Carbon::now()->endOfDay(),
                ])
                ->selectRaw('DATE(booking_date) as day, SUM(net_paid) as total')
                ->groupBy('day')
                ->pluck('total', 'day');
        });

        $platformSparkline = collect(range(6, 0))->map(function ($daysAgo) use ($dailySums) {
            $day = Carbon::now()->subDays($daysAgo)->toDateString();

            return (float) ($dailySums[$day] ?? 0) * 0.20;
        })->toArray();

        return [
            Stat::make('إجمالي الطلاب', number_format($statsData['student_count']))
                ->description('الطلاب المسجلين • عرض القائمة ↗')
                ->descriptionIcon('heroicon-m-users')
                ->color('primary')
                ->url(UserResource::getUrl('index', ['tableFilters' => ['role' => ['value' => 'student']]])),

            Stat::make('المعلمين المعتمدين', number_format($statsData['teacher_count']))
                ->description('جاهزون لتقديم الحصص • إدارة المعلمين ↗')
                ->descriptionIcon('heroicon-m-academic-cap')
                ->color('info')
                ->url(TeacherProfileResource::getUrl('index')),

            Stat::make('أرباح المنصة الصافية', number_format($statsData['total_revenue'], 2).' SAR')
                ->description('نمو أرباح المنصة (20%) • سجل الحصص ↗')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success')
                ->chart($platformSparkline)
                ->url(BookingResource::getUrl('index', ['tableFilters' => ['status' => ['value' => 'completed']]])),

            Stat::make('طلبات سحب معلقة', number_format($statsData['pending_payouts']))
                ->description($statsData['pending_payouts'] > 0 ? 'تتطلب مراجعة الإدارة • مراجعة الطلبات ↗' : 'لا توجد طلبات معلقة ✅')
                ->descriptionIcon('heroicon-m-clock')
                ->color($statsData['pending_payouts'] > 0 ? 'warning' : 'gray')
                ->url(PayoutRequestResource::getUrl('index', ['tableFilters' => ['status' => ['value' => 'pending']]])),
        ];
    }
}
