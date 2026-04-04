<?php

namespace App\Filament\Resources\UserResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class StudentBookingsRelationManager extends RelationManager
{
    protected static string $relationship = 'studentBookings';

    protected static ?string $title = 'سجل الحجوزات (كطالب)';
    protected static ?string $modelLabel = 'حجز';
    protected static ?string $pluralModelLabel = 'حجوزات';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('id')
                    ->required()
                    ->maxLength(255),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->emptyStateHeading('لا توجد حجوزات مسجلة')
            ->recordTitleAttribute('id')
            ->columns([
                Tables\Columns\TextColumn::make('id')->label('رقم الحجز')->sortable(),
                Tables\Columns\TextColumn::make('teacher.name')->label('المعلم')->searchable()->color('primary')->weight('bold'),
                Tables\Columns\TextColumn::make('booking_date')->label('تاريخ الحصة')->dateTime('Y-m-d h:i A')->sortable(),
                Tables\Columns\TextColumn::make('net_paid')->label('المبلغ')->money('SAR')->sortable()->badge()->color('success'),
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
            ])
            ->filters([
                //
            ])
            ->headerActions([])
            ->actions([
                Tables\Actions\ViewAction::make()->url(fn ($record) => \App\Filament\Resources\BookingResource::getUrl('index') . '?tableFilters[id][value]=' . $record->id),
            ])
            ->bulkActions([]);
    }
}
