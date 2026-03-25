<?php

namespace App\Filament\Widgets;

use App\Models\Booking;
use App\Models\PayoutRequest;
use App\Models\Wallet;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class FinancialOverview extends BaseWidget
{
    // ترتيب الودجت في الصفحة الرئيسية (ليكون في الأعلى)
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        // 1. إجمالي المبيعات (الحصص المكتملة فقط)
        $totalSales = Booking::where('status', 'completed')->sum('net_paid');
        
        // 2. إجمالي الالتزامات (أموال المعلمين والطلاب الموجودة في المحافظ حالياً)
        $totalWalletsBalance = Wallet::sum('balance');
        
        // 3. إجمالي طلبات السحب المعلقة التي تحتاج موافقة
        $pendingPayouts = PayoutRequest::where('status', 'pending')->sum('amount');

        return [
            Stat::make('إجمالي المبيعات (الحصص المكتملة)', number_format($totalSales, 2) . ' SAR')
                ->description('إجمالي ما تم دفعه للحصص المنتهية بنجاح')
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->color('success')
                ->chart([7, 10, 15, 20, 25, $totalSales]), 

            Stat::make('إجمالي أرصدة المحافظ (التزامات)', number_format($totalWalletsBalance, 2) . ' SAR')
                ->description('مجموع الأموال المتاحة حالياً في محافظ المستخدمين')
                ->descriptionIcon('heroicon-m-wallet')
                ->color('info'),

            Stat::make('طلبات السحب المعلقة', number_format($pendingPayouts, 2) . ' SAR')
                ->description('مبالغ تنتظر المراجعة والتحويل البنكي')
                ->descriptionIcon('heroicon-m-clock')
                ->color('warning')
                ->extraAttributes([
                    'class' => $pendingPayouts > 0 ? 'animate-pulse' : '',
                ]),
        ];
    }
}