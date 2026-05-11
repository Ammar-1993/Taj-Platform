<?php

namespace App\Filament\Widgets;

use App\Models\Booking;
use App\Models\PayoutRequest;
use App\Models\Wallet;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;

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
        $salesSparkline = collect(range(6, 0))->map(function ($daysAgo) {
            return Booking::where('status', 'completed')
                ->whereDate('booking_date', Carbon::now()->subDays($daysAgo)->toDateString())
                ->sum('net_paid');
        })->toArray();

        return [
            Stat::make('إجمالي المبيعات (الحصص المكتملة)', number_format($totalSales, 2).' SAR')
                ->description('إجمالي المقبوضات للحصص المنجزة')
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->color('success')
                ->chart($salesSparkline), // بيانت ديناميكية 100%

            Stat::make('إجمالي أرصدة المحافظ (التزامات)', number_format($totalWalletsBalance, 2).' SAR')
                ->description('مجموع الأموال المتاحة حالياً في محافظ المستخدمين')
                ->descriptionIcon('heroicon-m-wallet')
                ->color('info'),

            Stat::make('طلبات السحب المعلقة', number_format($pendingPayouts, 2).' SAR')
                ->description('مبالغ تنتظر المراجعة والتحويل البنكي')
                ->descriptionIcon('heroicon-m-clock')
                ->color('warning')
                ->extraAttributes([
                    'class' => $pendingPayouts > 0 ? 'animate-pulse' : '',
                ]),
        ];
    }
}
