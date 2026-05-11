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

    protected static ?string $navigationGroup = 'المحتوى الأكاديمي';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('البيانات الأساسية وتسعير المرحلة')
                    ->description('تحكم في أسماء المراحل وأسعار الحصص الخاصة بها.')
                    ->icon('heroicon-o-currency-dollar')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('اسم المرحلة')
                            ->required()
                            ->maxLength(255)
                            ->unique(ignoreRecord: true)
                            ->placeholder('مثال: المرحلة المتوسطة'),

                        Forms\Components\TextInput::make('session_price')
                            ->label('سعر الحصة الموحد لهذه المرحلة')
                            ->required()
                            ->numeric()
                            ->prefix('SAR')
                            ->minValue(10) // حماية: منع إدخال سعر أقل من 10 ريال
                            ->maxValue(5000),

                        Forms\Components\Toggle::make('is_active')
                            ->label('مفعلة؟')
                            ->default(true)
                            ->helperText('المرحلة المعطلة لن تظهر للطلاب عند التسجيل.'),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('المرحلة الدراسية')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('session_price')
                    ->label('سعر الحصة (ثابت)')
                    ->formatStateUsing(fn ($state) => number_format((float) $state, 2).' SAR')
                    ->sortable()
                    ->badge() // جعل السعر يظهر بشكل بارز كـ Badge
                    ->color('success'),

                // إضافة عداد الطلاب المسجلين في هذه المرحلة
                Tables\Columns\TextColumn::make('student_profiles_count')
                    ->counts('studentProfiles')
                    ->label('عدد الطلاب المنضمين')
                    ->badge()
                    ->color('warning'),

                Tables\Columns\ToggleColumn::make('is_active')
                    ->label('حالة التفعيل'),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('آخر تحديث للسعر')
                    ->since() // يظهر بشكل "منذ يومين" بدلاً من تاريخ جامد
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('حالة التفعيل'),
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
