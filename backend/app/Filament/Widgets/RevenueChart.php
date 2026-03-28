<?php

namespace App\Filament\Widgets;

use App\Models\Booking;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;

class RevenueChart extends ChartWidget
{
    protected static ?string $heading = 'تحليل إيرادات المنصة (آخر 7 أيام)';
    protected static ?int $sort = 2;
    protected int | string | array $columnSpan = 'full';
    
    // Optional: Max height to keep it sleek
    protected static ?string $maxHeight = '300px';

    protected function getData(): array
    {
        $data = [];
        $labels = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            
            // حساب الإيرادات للحصص المكتملة في هذا اليوم
            $sum = Booking::where('status', 'completed')
                ->whereDate('booking_date', $date->toDateString())
                ->sum('net_paid');

            // تنسيق التاريخ بالعربية
            $labels[] = $date->translatedFormat('D, d M'); 
            $data[] = $sum;
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
