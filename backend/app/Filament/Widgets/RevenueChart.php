<?php

namespace App\Filament\Widgets;

use App\Models\Booking;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class RevenueChart extends ChartWidget
{
    protected static ?string $heading = 'تحليل إيرادات المنصة ومبيعات الحصص (آخر 7 أيام)';

    protected static ?string $description = 'متابعة حركة المبيعات اليومية للحصص المنفذة بالريال السعودي';

    protected static ?int $sort = 2;

    protected int|string|array $columnSpan = 'full';

    protected static ?string $maxHeight = '280px';

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
            $day = $date->toDateString();

            $labels[] = $date->translatedFormat('D، d M');
            $data[] = (float) ($dailySums[$day] ?? 0);
        }

        return [
            'datasets' => [
                [
                    'label' => 'المبيعات اليومية (SAR)',
                    'data' => $data,
                    'fill' => true,
                    'borderColor' => '#1D4ED8',
                    'backgroundColor' => 'rgba(29, 78, 216, 0.12)',
                    'borderWidth' => 2.5,
                    'pointBackgroundColor' => '#1D4ED8',
                    'pointBorderColor' => '#ffffff',
                    'pointHoverRadius' => 6,
                    'pointRadius' => 4,
                    'tension' => 0.4,
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getOptions(): array
    {
        return [
            'plugins' => [
                'legend' => [
                    'display' => true,
                    'position' => 'top',
                    'labels' => [
                        'font' => [
                            'family' => 'Cairo, sans-serif',
                            'size' => 12,
                            'weight' => '600',
                        ],
                    ],
                ],
            ],
            'scales' => [
                'y' => [
                    'beginAtZero' => true,
                    'grid' => [
                        'color' => 'rgba(156, 163, 175, 0.12)',
                    ],
                    'ticks' => [
                        'font' => [
                            'family' => 'Cairo, sans-serif',
                        ],
                    ],
                ],
                'x' => [
                    'grid' => [
                        'display' => false,
                    ],
                    'ticks' => [
                        'font' => [
                            'family' => 'Cairo, sans-serif',
                        ],
                    ],
                ],
            ],
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }
}
