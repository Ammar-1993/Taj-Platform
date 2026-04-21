<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class UserResource extends Resource
{
    protected static ?string $model = User::class;
    protected static ?string $navigationIcon = 'heroicon-o-users';
    protected static ?string $modelLabel = 'مستخدم';
    protected static ?string $pluralModelLabel = 'إدارة المستخدمين';
    protected static ?string $navigationGroup = 'الإدارة والمستخدمين';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('البيانات الأساسية للمستخدم')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('الاسم الكامل')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('email')
                            ->label('البريد الإلكتروني')
                            ->email()
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255),
                        Forms\Components\TextInput::make('phone')
                            ->label('رقم الجوال')
                            ->tel()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255),
                        Forms\Components\TextInput::make('password')
                            ->label('كلمة المرور')
                            ->password()
                            ->dehydrateStateUsing(fn ($state) => Hash::make($state))
                            ->dehydrated(fn ($state) => filled($state))
                            ->required(fn (string $context): bool => $context === 'create')
                            ->maxLength(255),
                    ])->columns(['sm' => 1, 'md' => 2]), // Responsive fluid columns

                Forms\Components\Section::make('الصلاحيات والحالة')
                    ->schema([
                        Forms\Components\Select::make('roles')
                            ->label('الصلاحية (الدور)')
                            ->relationship('roles', 'name')
                            ->getOptionLabelFromRecordUsing(fn ($record) => match ($record->name) {
                                'admin' => 'مدير نظام',
                                'teacher' => 'معلم',
                                'student' => 'طالب',
                                'parent' => 'ولي أمر',
                                default => $record->name,
                            })
                            ->multiple()
                            ->preload()
                            ->searchable(),
                        Forms\Components\Toggle::make('is_active')
                            ->label('حساب نشط (يمكنه تسجيل الدخول)')
                            ->default(true),
                    ])->columns(['sm' => 1, 'md' => 2]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('الاسم')
                    ->searchable()
                    ->weight('bold'),

                // 🟢 مخفي افتراضياً لمنع شريط التمرير الأفقي
                Tables\Columns\TextColumn::make('email')
                    ->label('البريد الإلكتروني')
                    ->searchable()
                    ->copyable()
                    ->visibleFrom('md'),

                // 🟢 مخفي افتراضياً
                Tables\Columns\TextColumn::make('phone')
                    ->label('الجوال')
                    ->searchable()
                    ->visibleFrom('lg'),

                Tables\Columns\TextColumn::make('roles.name')
                    ->label('الدور')
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

                Tables\Columns\ToggleColumn::make('is_active')
                    ->label('نشط'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('تاريخ التسجيل')
                    ->dateTime('Y-m-d')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\TrashedFilter::make()->label('المحذوفات'),
                Tables\Filters\SelectFilter::make('role')
                    ->label('تصفية حسب الدور')
                    ->relationship('roles', 'name')
                    ->getOptionLabelFromRecordUsing(fn ($record) => match ($record->name) {
                        'admin' => 'مدير نظام',
                        'teacher' => 'معلم',
                        'student' => 'طالب',
                        'parent' => 'ولي أمر',
                        default => $record->name,
                    }),
            ])
            ->actions([
                Tables\Actions\ActionGroup::make([
                    Tables\Actions\Action::make('wallet')
                        ->label('المحفظة')
                        ->icon('heroicon-o-wallet')
                        ->color('info')
                        ->modalHeading(fn (User $record) => 'محفظة ' . $record->name)
                        ->infolist([
                            \Filament\Infolists\Components\TextEntry::make('wallet.balance')
                                ->label('الرصيد المتاح')
                                ->formatStateUsing(fn ($state) => number_format((float) $state, 2) . ' SAR')
                                ->size(\Filament\Infolists\Components\TextEntry\TextEntrySize::Large)
                                ->weight('bold')
                                ->color('success'),
                            \Filament\Infolists\Components\TextEntry::make('wallet.pending_balance')
                                ->label('الرصيد المعلق')
                                ->formatStateUsing(fn ($state) => number_format((float) $state, 2) . ' SAR')
                                ->color('warning'),
                        ])
                        ->modalSubmitAction(false)
                        ->modalCancelAction(fn (\Filament\Actions\StaticAction $action) => $action->label('إغلاق')),
                    Tables\Actions\EditAction::make(),
                    Tables\Actions\DeleteAction::make(),
                    Tables\Actions\RestoreAction::make(),
                ])->icon('heroicon-m-ellipsis-vertical'),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\RestoreBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array { 
        return [
            UserResource\RelationManagers\StudentBookingsRelationManager::class,
        ]; 
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'edit' => Pages\EditUser::route('/{record}/edit'),
        ];
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->withoutGlobalScopes([
                SoftDeletingScope::class,
            ]);
    }
}