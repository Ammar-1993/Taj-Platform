<?php

namespace App\Filament\Widgets;

use App\Models\User;
use App\Models\Booking;
use App\Models\PayoutRequest;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;

class DashboardStats extends BaseWidget
{
    // ترتيب الودجت في الصفحة (رقم 1 يعني في الأعلى)
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        // حساب أرباح المنصة (20% من إجمالي الحجوزات المكتملة)
        $totalPlatformRevenue = Booking::where('status', 'completed')->sum('net_paid') * 0.20;

        // بيانات النمو لأرباح المنصة آخر 7 أيام لتزين واجهة الـ Widget
        $platformSparkline = collect(range(6, 0))->map(function ($daysAgo) {
            // أرباح المنصة هي 20%
            return Booking::where('status', 'completed')
                ->whereDate('booking_date', Carbon::now()->subDays($daysAgo)->toDateString())
                ->sum('net_paid') * 0.20;
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

            Stat::make('أرباح المنصة الصافية', number_format($totalPlatformRevenue, 2) . ' SAR')
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