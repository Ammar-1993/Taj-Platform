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
    
    // أيقونات وأسماء معربة ومرتبة
    protected static ?string $navigationIcon = 'heroicon-o-book-open';
    protected static ?string $modelLabel = 'مادة دراسية';
    protected static ?string $pluralModelLabel = 'المواد الدراسية';
    protected static ?string $navigationGroup = 'المحتوى الأكاديمي';
    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('بيانات المادة')
                    ->description('أدخل تفاصيل المادة الدراسية التي ستظهر للطلاب.')
                    ->icon('heroicon-o-information-circle')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('اسم المادة')
                            ->required()
                            ->maxLength(255)
                            ->unique(ignoreRecord: true) // منع التكرار
                            ->placeholder('مثال: لغتي الجميلة'),
                            
                        Forms\Components\FileUpload::make('icon_path')
                            ->label('أيقونة المادة (اختياري)')
                            ->image()
                            ->directory('subjects-icons')
                            ->imageEditor() // يتيح للمدير قص وتعديل الصورة قبل الرفع!
                            ->columnSpanFull(),
                            
                        Forms\Components\Toggle::make('is_active')
                            ->label('مفعلة وتظهر في المنصة؟')
                            ->default(true)
                            ->helperText('إذا قمت بتعطيلها، لن يتمكن الطلاب الجدد من الحجز فيها.'),
                    ])->columns(2) // تقسيم الحقول بشكل متناسق
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('icon_path')
                    ->label('الأيقونة')
                    ->circular()
                    ->defaultImageUrl(url('https://ui-avatars.com/api/?name=مادة&color=1E40AF&background=DBEAFE')), // صورة افتراضية إن لم تكن موجودة

                Tables\Columns\TextColumn::make('name')
                    ->label('اسم المادة')
                    ->searchable()
                    ->sortable()
                    ->weight('bold')
                    ->color('primary'),

                // إضافة عداد المعلمين الذين يدرسون هذه المادة (لمسة احترافية)
                Tables\Columns\TextColumn::make('teacher_profiles_count')
                    ->counts('teacherProfiles')
                    ->label('عدد المعلمين')
                    ->badge()
                    ->color('info'),

                Tables\Columns\ToggleColumn::make('is_active')
                    ->label('الحالة (مفعل/معطل)'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('تاريخ الإضافة')
                    ->dateTime('Y-m-d')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                // فلتر سريع للبحث عن المواد المعطلة فقط
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('حالة التفعيل')
                    ->boolean()
                    ->trueLabel('المواد المفعلة')
                    ->falseLabel('المواد المعطلة'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
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