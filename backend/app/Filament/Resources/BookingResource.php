<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BookingResource\Pages;
use App\Models\Booking;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;

class BookingResource extends Resource
{
    protected static ?string $model = Booking::class;
    protected static ?string $navigationIcon = 'heroicon-o-calendar-days';
    protected static ?string $modelLabel = 'حجز';
    protected static ?string $pluralModelLabel = 'سجل الحجوزات';
    protected static ?string $navigationGroup = 'العمليات والمالية';
    protected static ?int $navigationSort = 1;

    // 🔒 منع إنشاء وتعديل الحجوزات من الإدارة للحفاظ على النزاهة المالية
    public static function canCreate(): bool { return false; }
    public static function canEdit(Model $record): bool { return false; }

    public static function form(Form $form): Form
    {
        return $form->schema([]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                // 🟢 مخفي افتراضياً لتوفير المساحة
                Tables\Columns\TextColumn::make('id')
                    ->label('رقم الحجز')
                    ->sortable()
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('student.name')
                    ->label('الطالب')
                    ->searchable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('teacher.name')
                    ->label('المعلم')
                    ->searchable()
                    ->color('primary')
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('booking_date')
                    ->label('تاريخ الحصة')
                    ->dateTime('Y-m-d h:i A') // عرض التاريخ والوقت بشكل أنيق
                    ->sortable(),

                Tables\Columns\TextColumn::make('net_paid')
                    ->label('الصافي المدفوع')
                    ->money('SAR')
                    ->sortable()
                    ->badge()
                    ->color('success'),

                Tables\Columns\TextColumn::make('status')
                    ->label('الحالة')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'scheduled' => 'info',
                        'in_progress' => 'warning',
                        'completed' => 'success',
                        'cancelled', 'refunded' => 'danger',
                        default => 'gray',
                    }),
            ])
            ->filters([
                // فلتر سريع لحالة الحجز
                Tables\Filters\SelectFilter::make('status')
                    ->label('تصفية حسب الحالة')
                    ->options([
                        'scheduled' => 'مجدول',
                        'in_progress' => 'قيد التنفيذ',
                        'completed' => 'مكتمل',
                        'cancelled' => 'ملغي',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
            ])
            ->bulkActions([]);
    }

    public static function getRelations(): array { return []; }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListBookings::route('/'),
        ];
    }
}