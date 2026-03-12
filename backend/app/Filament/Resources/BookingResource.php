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

    // 🔒 منع إنشاء حجوزات من لوحة التحكم (يجب أن تتم عبر التطبيق فقط)
    public static function canCreate(): bool
    {
        return false;
    }

    // 🔒 منع التعديل على الحجوزات لحماية السجلات المالية
    public static function canEdit(Model $record): bool
    {
        return false;
    }

    public static function form(Form $form): Form
    {
        return $form->schema([]); // لا نحتاج فورم لأننا منعنا الإضافة والتعديل
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('رقم الحجز')
                    ->sortable()
                    ->searchable(),
                Tables\Columns\TextColumn::make('student.name')
                    ->label('الطالب')
                    ->searchable(),
                Tables\Columns\TextColumn::make('teacher.name')
                    ->label('المعلم')
                    ->searchable(),
                Tables\Columns\TextColumn::make('booking_date')
                    ->label('تاريخ الحصة')
                    ->date()
                    ->sortable(),
                Tables\Columns\TextColumn::make('net_paid')
                    ->label('الصافي المدفوع')
                    ->money('SAR')
                    ->sortable(),
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
                //
            ])
            ->actions([
                // عرض التفاصيل فقط دون تعديل
                Tables\Actions\ViewAction::make(),
            ])
            ->bulkActions([
                // تركناها فارغة عمداً لمنع الحذف الجماعي
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListBookings::route('/'),
        ];
    }
}