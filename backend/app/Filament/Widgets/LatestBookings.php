<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\BookingResource;
use App\Models\Booking;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class LatestBookings extends BaseWidget
{
    protected static ?int $sort = 4; // الصف الأخير في لوحة التحكم

    protected int|string|array $columnSpan = 'full'; // يأخذ عرض الشاشة بالكامل

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Booking::query()->with(['student', 'teacher'])->latest()->limit(10) // أحدث 10 حجوزات مع التحميل المسبق
            )
            ->heading('أحدث الحجوزات في المنصة')
            ->headerActions([
                Tables\Actions\Action::make('view_all')
                    ->label('عرض جميع الحجوزات ↗')
                    ->url(BookingResource::getUrl('index'))
                    ->color('primary')
                    ->button()
                    ->size('sm'),
            ])
            ->recordUrl(
                fn (Booking $record): string => BookingResource::getUrl('index', ['tableSearch' => $record->id])
            )
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('رقم الحجز')
                    ->formatStateUsing(fn ($state) => "#{$state}")
                    ->weight('bold')
                    ->color('primary')
                    ->sortable(),

                Tables\Columns\TextColumn::make('student.name')
                    ->label('الطالب')
                    ->icon('heroicon-m-user')
                    ->iconColor('gray')
                    ->searchable(),

                Tables\Columns\TextColumn::make('teacher.name')
                    ->label('المعلم')
                    ->icon('heroicon-m-academic-cap')
                    ->iconColor('primary')
                    ->searchable(),

                Tables\Columns\TextColumn::make('net_paid')
                    ->label('المبلغ')
                    ->formatStateUsing(fn ($state) => number_format((float) $state, 2).' SAR')
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('status')
                    ->label('الحالة')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'scheduled' => 'info',
                        'in_progress' => 'warning',
                        'completed' => 'success',
                        'cancelled', 'refunded' => 'danger',
                        'abandoned' => 'gray',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'scheduled' => 'مجدول',
                        'in_progress' => 'قيد التنفيذ',
                        'completed' => 'مكتمل',
                        'cancelled' => 'ملغي',
                        'refunded' => 'مسترجع',
                        'abandoned' => 'مهجورة',
                        default => $state,
                    }),

                Tables\Columns\TextColumn::make('booking_date')
                    ->label('موعد الحصة')
                    ->dateTime('Y-m-d H:i')
                    ->sortable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('تاريخ الإنشاء')
                    ->dateTime('Y-m-d H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->paginated(false)
            ->emptyStateHeading('لا توجد حجوزات بعد')
            ->emptyStateDescription('ستظهر هنا أحدث الحجوزات فور إنشائها في المنصة.')
            ->emptyStateIcon('heroicon-o-calendar');
    }
}
