<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\BookingResource;
use App\Filament\Resources\PayoutRequestResource;
use App\Filament\Resources\WalletResource;
use App\Models\Booking;
use App\Models\PayoutRequest;
use App\Models\Wallet;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class FinancialOverview extends BaseWidget
{
    // ترتيب الودجت: الصف الثالث بعد الرسم البياني
    protected static ?int $sort = 3;

    protected function getStats(): array
    {
        // 1. إجمالي المبيعات (الحصص المكتملة فقط)
        $totalSales = Booking::where('status', 'completed')->sum('net_paid');

        // 2. إجمالي الالتزامات (أموال المعلمين والطلاب الموجودة في المحافظ حالياً)
        $totalWalletsBalance = Wallet::sum('balance');

        // 3. إجمالي طلبات السحب المعلقة التي تحتاج موافقة
        $pendingPayouts = PayoutRequest::where('status', 'pending')->sum('amount');

        // إنشاء بيانات الرسم البياني الجانبي (Sparkline) لآخر 7 أيام
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

        $salesSparkline = collect(range(6, 0))->map(function ($daysAgo) use ($dailySums) {
            $day = Carbon::now()->subDays($daysAgo)->toDateString();

            return (float) ($dailySums[$day] ?? 0);
        })->toArray();

        return [
            Stat::make('إجمالي المبيعات (الحصص المكتملة)', number_format($totalSales, 2).' SAR')
                ->description('إجمالي المقبوضات للحصص المنجزة • عرض الحجوزات ↗')
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->color('success')
                ->chart($salesSparkline)
                ->url(BookingResource::getUrl('index', ['tableFilters' => ['status' => ['value' => 'completed']]])),

            Stat::make('إجمالي أرصدة المحافظ (التزامات)', number_format($totalWalletsBalance, 2).' SAR')
                ->description('مجموع الأموال المتاحة في المحافظ • كشف الحسابات ↗')
                ->descriptionIcon('heroicon-m-wallet')
                ->color('info')
                ->url(WalletResource::getUrl('index')),

            Stat::make('طلبات السحب المعلقة', number_format($pendingPayouts, 2).' SAR')
                ->description($pendingPayouts > 0 ? 'مبالغ تنتظر التحويل البنكي • إدارة السحوبات ↗' : 'لا توجد مبالغ معلقة ✅')
                ->descriptionIcon('heroicon-m-clock')
                ->color($pendingPayouts > 0 ? 'warning' : 'gray')
                ->extraAttributes([
                    'class' => $pendingPayouts > 0 ? 'animate-pulse' : '',
                ])
                ->url(PayoutRequestResource::getUrl('index', ['tableFilters' => ['status' => ['value' => 'pending']]])),
        ];
    }
}
