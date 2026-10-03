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
    protected static ?int $sort = 3;

    protected function getStats(): array
    {
        $totalSales = Booking::where('status', 'completed')->sum('net_paid');
        $totalWalletsBalance = Wallet::sum('balance');
        $pendingPayouts = PayoutRequest::where('status', 'pending')->sum('amount');

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
            Stat::make('إجمالي المبيعات', number_format($totalSales, 2).' SAR')
                ->description('إيرادات الحصص المكتملة')
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->color('success')
                ->chart($salesSparkline)
                ->url(BookingResource::getUrl('index', ['tableFilters' => ['status' => ['value' => 'completed']]])),

            Stat::make('أرصدة المحافظ', number_format($totalWalletsBalance, 2).' SAR')
                ->description('إجمالي أرصدة المستخدمين')
                ->descriptionIcon('heroicon-m-wallet')
                ->color('info')
                ->url(WalletResource::getUrl('index')),

            Stat::make('طلبات السحب المعلقة', number_format($pendingPayouts, 2).' SAR')
                ->description($pendingPayouts > 0 ? 'بانتظار التحويل البنكي' : 'لا توجد مبالغ معلقة')
                ->descriptionIcon($pendingPayouts > 0 ? 'heroicon-m-clock' : 'heroicon-m-check-circle')
                ->color($pendingPayouts > 0 ? 'warning' : 'success')
                ->url(PayoutRequestResource::getUrl('index', ['tableFilters' => ['status' => ['value' => 'pending']]])),
        ];
    }
}
