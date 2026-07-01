<?php

namespace App\Filament\Widgets;

use App\Models\Booking;
use App\Models\PayoutRequest;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class DashboardStats extends BaseWidget
{
    // ترتيب الودجت في الصفحة (رقم 1 يعني في الأعلى)
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        // حساب أرباح المنصة (20% من إجمالي الحجوزات المكتملة)
        $totalPlatformRevenue = Booking::where('status', 'completed')->sum('net_paid') * 0.20;

        // بيانات النمو لأرباح المنصة آخر 7 أيام لتزين واجهة الـ Widget
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
            Stat::make('إجمالي الطلاب', User::role('student')->count())
                ->description('عدد الطلاب المسجلين')
                ->descriptionIcon('heroicon-m-users')
                ->color('primary'), // Changed from Info to match primary Indigo palette

            Stat::make('المعلمين المعتمدين', User::role('teacher')->count())
                ->description('جاهزين لتقديم الحصص')
                ->descriptionIcon('heroicon-m-academic-cap')
                ->color('primary'),

            Stat::make('أرباح المنصة الصافية', number_format($totalPlatformRevenue, 2).' SAR')
                ->description('نمو أرباح المنصة الكلية (20%)')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success')
                ->chart($platformSparkline),

            Stat::make('طلبات سحب معلقة', PayoutRequest::where('status', 'pending')->count())
                ->description('تتطلب مراجعة الإدارة')
                ->descriptionIcon('heroicon-m-clock')
                ->color('warning'),
        ];
    }
}
