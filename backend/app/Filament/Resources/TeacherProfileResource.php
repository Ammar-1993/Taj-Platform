<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TeacherProfileResource\Pages;
use App\Models\TeacherProfile;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Table;

class TeacherProfileResource extends Resource
{
    protected static ?string $model = TeacherProfile::class;

    // أيقونة مناسبة لطلبات التوثيق
    protected static ?string $navigationIcon = 'heroicon-o-identification';

    protected static ?string $modelLabel = 'طلب انضمام معلم';

    protected static ?string $pluralModelLabel = 'طلبات توثيق المعلمين';

    protected static ?string $navigationGroup = 'الإدارة والمستخدمين';

    protected static ?int $navigationSort = 2; // ليكون تحت إدارة المستخدمين مباشرة

    // 🔒 منع الإضافة اليدوية من الإدارة (لأن المعلم هو من يسجل ويقدم الطلب)
    public static function canCreate(): bool
    {
        return false;
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('البيانات الأساسية')
                    ->schema([
                        Forms\Components\Placeholder::make('teacher_name')
                            ->label('اسم المعلم')
                            ->content(fn ($record) => $record?->user?->name ?? 'غير معروف'),
                        Forms\Components\Placeholder::make('teacher_email')
                            ->label('البريد الإلكتروني')
                            ->content(fn ($record) => $record?->user?->email ?? 'غير معروف'),
                        Forms\Components\Placeholder::make('subject_name')
                            ->label('المادة المراد تدريسها')
                            ->content(fn ($record) => $record?->subject?->name ?? 'غير محدد'),
                        Forms\Components\Textarea::make('bio')
                            ->label('النبذة التعريفية (كما كتبها المعلم)')
                            ->disabled()
                            ->columnSpanFull(),
                    ])->columns(['sm' => 1, 'md' => 2, 'lg' => 3]),

                Forms\Components\Section::make('المستندات المرفقة (للمراجعة)')
                    ->description('يرجى التحقق من صحة المستندات قبل توثيق الحساب.')
                    ->schema([
                        // 🟢 عرض الهوية مع إمكانية التحميل
                        Forms\Components\FileUpload::make('national_id_path')
                            ->label('صورة الهوية الوطنية')
                            ->disk('public') // تأكد من أنه نفس الـ disk المستخدم في الرفع
                            ->downloadable() // السماح للمدير بتحميلها لمراجعتها
                            ->openable() // فتحها في تاب جديد
                            ->disabled() // منع المدير من حذفها أو استبدالها
                            ->columnSpan(1),

                        // 🟢 عرض الشهادة مع إمكانية التحميل
                        Forms\Components\FileUpload::make('degree_path')
                            ->label('الشهادة الجامعية / الأكاديمية')
                            ->disk('public')
                            ->downloadable()
                            ->openable()
                            ->disabled()
                            ->columnSpan(1),
                    ])->columns(['sm' => 1, 'md' => 2]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('اسم المعلم')
                    ->searchable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('subject.name')
                    ->label('المادة')
                    ->searchable()
                    ->color('primary'),

                Tables\Columns\IconColumn::make('is_verified')
                    ->label('حالة التوثيق')
                    ->boolean()
                    ->trueIcon('heroicon-o-check-badge')
                    ->falseIcon('heroicon-o-clock')
                    ->trueColor('success')
                    ->falseColor('warning'),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('تاريخ الطلب / التحديث')
                    ->since()
                    ->sortable(),
            ])
            ->filters([
                // فلتر سريع للوصول للطلبات المعلقة
                Tables\Filters\TernaryFilter::make('is_verified')
                    ->label('حالة الطلب')
                    ->boolean()
                    ->trueLabel('حسابات موثقة ومفعلة ✅')
                    ->falseLabel('طلبات قيد المراجعة ⏳'),
            ])
            ->actions([
                Tables\Actions\ActionGroup::make([
                    Tables\Actions\ViewAction::make()->label('مراجعة الملف'),
                    Action::make('approve')
                        ->label('توثيق الحساب')
                        ->icon('heroicon-o-check-badge')
                        ->color('success')
                        ->requiresConfirmation()
                        ->modalHeading('توثيق حساب المعلم')
                        ->modalDescription('بمجرد توثيق الحساب، سيظهر المعلم فوراً للطلاب في نتائج البحث وسيتمكن من استقبال الحجوزات. هل أنت متأكد؟')
                        ->visible(fn (TeacherProfile $record): bool => ! $record->is_verified)
                        ->action(fn (TeacherProfile $record) => $record->update(['is_verified' => true])),
                    Action::make('suspend')
                        ->label('تجميد الحساب')
                        ->icon('heroicon-o-x-circle')
                        ->color('danger')
                        ->requiresConfirmation()
                        ->modalHeading('تجميد توثيق المعلم')
                        ->modalDescription('إذا قمت بتجميد التوثيق، سيختفي المعلم من نتائج البحث ولن يتمكن الطلاب من الحجز لديه. هل أنت متأكد؟')
                        ->visible(fn (TeacherProfile $record): bool => (bool) $record->is_verified)
                        ->action(fn (TeacherProfile $record) => $record->update(['is_verified' => false])),
                ])->icon('heroicon-m-ellipsis-vertical'),
            ])
            ->bulkActions([]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTeacherProfiles::route('/'),
            // قمنا بإزالة مسار الـ Create والـ Edit لأننا نعتمد على الـ ViewAction والأزرار السريعة فقط
        ];
    }
}
