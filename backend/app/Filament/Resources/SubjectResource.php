<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SubjectResource\Pages;
use App\Models\Subject;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class SubjectResource extends Resource
{
    protected static ?string $model = Subject::class;
    protected static ?string $navigationIcon = 'heroicon-o-book-open';
    protected static ?string $modelLabel = 'مادة دراسية';
    protected static ?string $pluralModelLabel = 'المواد الدراسية';
    protected static ?string $navigationGroup = 'البيانات الأساسية';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('name')
                    ->label('اسم المادة')
                    ->required()
                    ->maxLength(255),
                Forms\Components\FileUpload::make('icon_path')
                    ->label('أيقونة المادة')
                    ->image()
                    ->directory('subjects-icons'),
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
                    ->label('اسم المادة')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\ImageColumn::make('icon_path')
                    ->label('الأيقونة')
                    ->circular(),
                Tables\Columns\ToggleColumn::make('is_active')
                    ->label('مفعل'),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('تاريخ الإضافة')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
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
            'index' => Pages\ListSubjects::route('/'),
            'create' => Pages\CreateSubject::route('/create'),
            'edit' => Pages\EditSubject::route('/{record}/edit'),
        ];
    }
}