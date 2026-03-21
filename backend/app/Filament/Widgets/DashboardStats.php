<?php

namespace App\Filament\Widgets;

use App\Models\User;
use App\Models\Booking;
use App\Models\PayoutRequest;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class DashboardStats extends BaseWidget
{
    // ترتيب الودجت في الصفحة (رقم 1 يعني في الأعلى)
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        // حساب أرباح المنصة (20% من إجمالي الحجوزات المكتملة)
        $totalPlatformRevenue = Booking::where('status', 'completed')->sum('net_paid') * 0.20;

        return [
            Stat::make('إجمالي الطلاب', User::role('student')->count())
                ->description('عدد الطلاب المسجلين')
                ->descriptionIcon('heroicon-m-users')
                ->color('info'),

            Stat::make('المعلمين المعتمدين', User::role('teacher')->count())
                ->description('جاهزين لتقديم الحصص')
                ->descriptionIcon('heroicon-m-academic-cap')
                ->color('success'),

            Stat::make('أرباح المنصة الصافية', number_format($totalPlatformRevenue, 2) . ' SAR')
                ->description('تمثل 20% من الحصص المكتملة')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success'),

            Stat::make('طلبات سحب معلقة', PayoutRequest::where('status', 'pending')->count())
                ->description('تتطلب مراجعة الإدارة')
                ->descriptionIcon('heroicon-m-clock')
                ->color('warning'),
        ];
    }
}