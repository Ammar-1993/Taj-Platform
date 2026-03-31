<?php

namespace App\Filament\Widgets;

use App\Models\Booking;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class LatestBookings extends BaseWidget
{
    protected static ?int $sort = 4; // الصف الأخير في لوحة التحكم
    protected int | string | array $columnSpan = 'full'; // يأخذ عرض الشاشة بالكامل

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Booking::query()->latest()->limit(10) // أحدث 10 حجوزات
            )
            ->heading('أحدث الحجوزات في المنصة')
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('رقم الحجز')
                    ->sortable(),
                Tables\Columns\TextColumn::make('student.name')
                    ->label('الطالب'),
                Tables\Columns\TextColumn::make('teacher.name')
                    ->label('المعلم'),
                Tables\Columns\TextColumn::make('net_paid')
                    ->label('المبلغ')
                    ->money('SAR')
                    ->weight('bold'),
                Tables\Columns\TextColumn::make('status')
                    ->label('الحالة')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'scheduled' => 'info',
                        'in_progress' => 'warning',
                        'completed' => 'success',
                        'cancelled', 'refunded' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'scheduled' => 'مجدول',
                        'in_progress' => 'قيد التنفيذ',
                        'completed' => 'مكتمل',
                        'cancelled' => 'ملغي',
                        'refunded' => 'مسترجع',
                        default => $state,
                    }),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('وقت الحجز')
                    ->dateTime('Y-m-d H:i')
                    ->sortable(),
            ])
            ->paginated(false) // نلغي التصفح لأننا نعرض 10 فقط
            ->emptyStateHeading('لا توجد حجوزات بعد')
            ->emptyStateDescription('ستظهر هنا أحدث الحجوزات فور إنشائها.')
            ->emptyStateIcon('heroicon-o-calendar');
    }
}