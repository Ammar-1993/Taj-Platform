<?php

namespace App\Filament\Resources;

use App\Filament\Resources\GradeLevelResource\Pages;
use App\Models\GradeLevel;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class GradeLevelResource extends Resource
{
    protected static ?string $model = GradeLevel::class;
    protected static ?string $navigationIcon = 'heroicon-o-academic-cap';
    protected static ?string $modelLabel = 'مرحلة دراسية';
    protected static ?string $pluralModelLabel = 'المراحل الدراسية';
    protected static ?string $navigationGroup = 'البيانات الأساسية';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('name')
                    ->label('اسم المرحلة')
                    ->required()
                    ->maxLength(255),
                Forms\Components\TextInput::make('session_price')
                    ->label('سعر الحصة الافتراضي')
                    ->required()
                    ->numeric()
                    ->prefix('SAR'),
                Forms\Components\Toggle::make('is_active')
                    ->label('مفعل')
                    ->default(true),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('اسم المرحلة')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('session_price')
                    ->label('سعر الحصة')
                    ->money('SAR') // تنسيق العملة آلياً
                    ->sortable(),
                Tables\Columns\ToggleColumn::make('is_active')
                    ->label('مفعل'),
            ])
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGradeLevels::route('/'),
            'create' => Pages\CreateGradeLevel::route('/create'),
            'edit' => Pages\EditGradeLevel::route('/{record}/edit'),
        ];
    }
}