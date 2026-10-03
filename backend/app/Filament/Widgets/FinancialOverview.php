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

class FinancialOverview extends BaseWidget
{
    protected static ?int $sort = 3;

    protected function getStats(): array
    {
        $totalSales = Booking::where('status', 'completed')->sum('net_paid');
        $totalWalletsBalance = Wallet::sum('balance');
        $pendingPayouts = PayoutRequest::where('status', 'pending')->sum('amount');

        return [
            Stat::make('إجمالي المبيعات', number_format($totalSales, 2).' SAR')
                ->description('إيرادات الحصص المكتملة')
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->color('success')
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
