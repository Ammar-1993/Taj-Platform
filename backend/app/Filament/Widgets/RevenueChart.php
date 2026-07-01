<?php

namespace App\Filament\Widgets;

use App\Models\Booking;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class RevenueChart extends ChartWidget
{
    protected static ?string $heading = 'تحليل إيرادات المنصة (آخر 7 أيام)';

    protected static ?int $sort = 2;

    protected int|string|array $columnSpan = 'full';

    // Optional: Max height to keep it sleek
    protected static ?string $maxHeight = '300px';

    protected function getData(): array
    {
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

        $data = [];
        $labels = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $day  = $date->toDateString();

            $labels[] = $date->translatedFormat('D, d M');
            $data[]   = (float) ($dailySums[$day] ?? 0);
        }

        return [
            'datasets' => [
                [
                    'label' => 'المبيعات اليومية (ريال سعودي)',
                    'data' => $data,
                    'fill' => 'start', // يعطي تأثير متدرج (Gradient) تحت الخط في الإصدار الثالث!
                    'borderColor' => '#4f46e5', // Indigo-600 to match the theme
                    'backgroundColor' => 'rgba(79, 70, 229, 0.2)',
                    'tension' => 0.4, // انحناء سلس للخط
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }
}
