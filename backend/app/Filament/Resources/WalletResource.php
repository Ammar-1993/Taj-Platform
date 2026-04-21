<?php

namespace App\Filament\Resources;

use App\Filament\Resources\WalletResource\Pages;
use App\Models\Wallet;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class WalletResource extends Resource
{
    protected static ?string $model = Wallet::class;
    
    protected static ?string $navigationIcon = 'heroicon-o-wallet';
    protected static ?string $modelLabel = 'محفظة مالية';
    protected static ?string $pluralModelLabel = 'السجل المالي للمحافظ';
    protected static ?string $navigationGroup = 'العمليات والمالية';
    protected static ?int $navigationSort = 3;

    public static function canCreate(): bool { return false; }
    public static function canEdit($record): bool { return false; }
    public static function canDelete($record): bool { return false; }

    public static function form(Form $form): Form
    {
        return $form->schema([]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('صاحب المحفظة')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('user.roles.name')
                    ->label('نوع الحساب')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'admin' => 'مدير نظام',
                        'teacher' => 'معلم',
                        'student' => 'طالب',
                        'parent' => 'ولي أمر',
                        default => $state,
                    })
                    ->color(fn (string $state): string => match ($state) {
                        'admin' => 'danger',
                        'teacher' => 'success',
                        'student' => 'info',
                        'parent' => 'warning',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('balance')
                    ->label('الرصيد المتاح')
                    ->formatStateUsing(fn ($state) => number_format((float) $state, 2) . ' SAR')
                    ->sortable()
                    ->badge()
                    ->color(fn ($state) => $state > 0 ? 'success' : 'gray'),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('آخر حركة مالية')
                    ->since()
                    ->sortable(),
            ])
            ->defaultSort('balance', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('role')
                    ->label('تصفية حسب نوع الحساب')
                    ->relationship('user.roles', 'name')
                    ->getOptionLabelFromRecordUsing(fn ($record) => match ($record->name) {
                        'admin' => 'مدير نظام',
                        'teacher' => 'معلم',
                        'student' => 'طالب',
                        'parent' => 'ولي أمر',
                        default => $record->name,
                    })
            ])
            ->actions([])
            ->bulkActions([]);
    }

    public static function getRelations(): array { return []; }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListWallets::route('/'),
        ];
    }
}