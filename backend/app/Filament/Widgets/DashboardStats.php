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
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;

class DashboardStats extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $statsData = Cache::remember('filament_dashboard_stats', now()->addMinutes(5), function () {
            return [
                'student_count' => User::role('student')->count(),
                'teacher_count' => User::role('teacher')->count(),
                'total_revenue' => (float) (Booking::where('status', 'completed')->sum('net_paid') * 0.20),
                'pending_payouts' => PayoutRequest::where('status', 'pending')->count(),
                'student_role_id' => Role::where('name', 'student')->value('id'),
            ];
        });

        return [
            Stat::make('إجمالي الطلاب', number_format($statsData['student_count']))
                ->description('الطلاب المسجلين في المنصة')
                ->descriptionIcon('heroicon-m-users')
                ->color('primary')
                ->url(UserResource::getUrl('index', ['tableFilters' => ['role' => ['value' => (string) $statsData['student_role_id']]]])),

            Stat::make('المعلمين المعتمدين', number_format($statsData['teacher_count']))
                ->description('جاهزون لتقديم الحصص')
                ->descriptionIcon('heroicon-m-academic-cap')
                ->color('info')
                ->url(TeacherProfileResource::getUrl('index')),

            Stat::make('أرباح المنصة (20%)', number_format($statsData['total_revenue'], 2).' SAR')
                ->description('صافي عمولة المنصة المحققة')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success')
                ->url(BookingResource::getUrl('index', ['tableFilters' => ['status' => ['value' => 'completed']]])),

            Stat::make('طلبات سحب معلقة', number_format($statsData['pending_payouts']))
                ->description($statsData['pending_payouts'] > 0 ? 'بانتظار مراجعة الإدارة' : 'لا توجد طلبات معلقة')
                ->descriptionIcon($statsData['pending_payouts'] > 0 ? 'heroicon-m-clock' : 'heroicon-m-check-circle')
                ->color($statsData['pending_payouts'] > 0 ? 'warning' : 'success')
                ->url(PayoutRequestResource::getUrl('index', ['tableFilters' => ['status' => ['value' => 'pending']]])),
        ];
    }
}
