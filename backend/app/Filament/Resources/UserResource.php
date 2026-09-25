<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Models\Booking;
use App\Models\PayoutRequest;
use App\Models\User;
use Filament\Actions\StaticAction;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists\Components\RepeatableEntry;
use Filament\Infolists\Components\Section;
use Filament\Infolists\Components\TextEntry;
use Filament\Infolists\Components\TextEntry\TextEntrySize;
use Filament\Resources\Resource;
use Filament\Support\Enums\FontFamily;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Illuminate\Support\Facades\Hash;

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
                        ->modalHeading(fn (User $record) => 'محفظة: '.$record->name)
                        ->modalWidth('4xl')
                        ->infolist([
                            Section::make('الملخص المالي للمحفظة')
                                ->schema([
                                    TextEntry::make('wallet.balance')
                                        ->label('الرصيد المتاح')
                                        ->formatStateUsing(fn ($state) => number_format((float) ($state ?? 0), 2).' SAR')
                                        ->size(TextEntrySize::Large)
                                        ->weight('bold')
                                        ->color('success')
                                        ->icon('heroicon-o-check-circle'),

                                    TextEntry::make('pending_amount')
                                        ->label('المبالغ المعلقة')
                                        ->state(function (User $record): string {
                                            $amount = $record->hasRole('teacher')
                                                ? PayoutRequest::where('user_id', $record->id)->where('status', 'pending')->sum('amount')
                                                : Booking::where('booked_by_id', $record->id)->whereIn('status', ['scheduled', 'in_progress'])->sum('net_paid');

                                            return number_format((float) $amount, 2).' SAR';
                                        })
                                        ->color('warning')
                                        ->icon('heroicon-o-clock'),

                                    TextEntry::make('total_in')
                                        ->label(fn (User $record) => $record->hasRole('teacher') ? 'إجمالي أرباح الحصص' : 'إجمالي المبالغ المشحونة')
                                        ->state(fn (User $record): string => number_format((float) ($record->wallet?->transactions()->whereIn('type', ['deposit', 'class_earnings'])->sum('amount') ?? 0), 2).' SAR')
                                        ->color('info')
                                        ->icon('heroicon-o-arrow-trending-up'),

                                    TextEntry::make('total_out')
                                        ->label(fn (User $record) => $record->hasRole('teacher') ? 'إجمالي الأرباح المسحوبة' : 'إجمالي المدفوع للحصص')
                                        ->state(fn (User $record): string => number_format((float) ($record->wallet?->transactions()->whereIn('type', ['withdrawal', 'payment'])->sum('amount') ?? 0), 2).' SAR')
                                        ->color('danger')
                                        ->icon('heroicon-o-arrow-trending-down'),
                                ])
                                ->columns(['sm' => 1, 'md' => 2, 'lg' => 4]),

                            Section::make('سجل العمليات المالية الأخيرة')
                                ->description('عرض أحدث العمليات والتحويلات المسجلة في المحفظة.')
                                ->schema([
                                    RepeatableEntry::make('wallet_transactions')
                                        ->label('')
                                        ->state(fn (User $record) => $record->wallet?->transactions()->latest()->take(15)->get() ?? [])
                                        ->placeholder('لا توجد عمليات مالية مسجلة في هذه المحفظة حتى الآن.')
                                        ->schema([
                                            TextEntry::make('type')
                                                ->label('نوع العملية')
                                                ->state(fn ($record) => $record?->type)
                                                ->badge()
                                                ->color(fn (?string $state): string => match ($state) {
                                                    'deposit' => 'success',
                                                    'class_earnings' => 'primary',
                                                    'refund' => 'info',
                                                    'payment' => 'danger',
                                                    'withdrawal' => 'gray',
                                                    default => 'gray',
                                                })
                                                ->formatStateUsing(fn (?string $state): string => match ($state) {
                                                    'deposit' => 'شحن محفظة',
                                                    'class_earnings' => 'أرباح حصة',
                                                    'refund' => 'استرجاع مالي',
                                                    'payment' => 'دفع حجز',
                                                    'withdrawal' => 'سحب أرباح',
                                                    default => $state ?? '—',
                                                }),
                                            TextEntry::make('amount')
                                                ->label('المبلغ')
                                                ->state(fn ($record) => $record?->amount)
                                                ->weight('bold')
                                                ->color(fn ($record) => in_array($record?->type, ['deposit', 'class_earnings', 'refund']) ? 'success' : 'danger')
                                                ->formatStateUsing(fn ($state, $record) => (in_array($record?->type, ['deposit', 'class_earnings', 'refund']) ? '+' : '-').number_format((float) ($state ?? 0), 2).' SAR'),
                                            TextEntry::make('description')
                                                ->label('البيان / الوصف')
                                                ->state(fn ($record) => $record?->description ?? '—')
                                                ->weight('medium'),
                                            TextEntry::make('created_at')
                                                ->label('التاريخ والوقت')
                                                ->state(fn ($record) => $record?->created_at)
                                                ->dateTime('Y-m-d h:i A')
                                                ->color('gray'),
                                        ])
                                        ->columns(['sm' => 1, 'md' => 4]),
                                ])
                                ->collapsible(),

                            Section::make('طلبات سحب الأرباح البنكية')
                                ->description('طلبات التحويل لحساب المعلم البنكي.')
                                ->schema([
                                    RepeatableEntry::make('payout_requests')
                                        ->label('')
                                        ->state(fn (User $record) => PayoutRequest::where('user_id', $record->id)->latest()->take(10)->get() ?? [])
                                        ->placeholder('لا توجد طلبات سحب أرباح مسجلة لهذا المعلم.')
                                        ->schema([
                                            TextEntry::make('amount')
                                                ->label('المبلغ')
                                                ->state(fn ($record) => $record?->amount)
                                                ->weight('bold')
                                                ->formatStateUsing(fn ($state) => number_format((float) ($state ?? 0), 2).' SAR'),
                                            TextEntry::make('bank_name')
                                                ->label('اسم البنك')
                                                ->state(fn ($record) => $record?->bank_name ?? '—'),
                                            TextEntry::make('iban')
                                                ->label('رقم الآيبان (IBAN)')
                                                ->state(fn ($record) => $record?->iban)
                                                ->copyable()
                                                ->copyMessage('تم نسخ الآيبان')
                                                ->fontFamily(FontFamily::Mono),
                                            TextEntry::make('status')
                                                ->label('حالة الطلب')
                                                ->state(fn ($record) => $record?->status)
                                                ->badge()
                                                ->color(fn (?string $state): string => match ($state) {
                                                    'pending' => 'warning',
                                                    'approved' => 'info',
                                                    'transferred' => 'success',
                                                    'rejected' => 'danger',
                                                    default => 'gray',
                                                })
                                                ->formatStateUsing(fn (?string $state): string => match ($state) {
                                                    'pending' => 'قيد الانتظار',
                                                    'approved' => 'معتمد',
                                                    'transferred' => 'تم التحويل',
                                                    'rejected' => 'مرفوض',
                                                    default => $state ?? '—',
                                                }),
                                            TextEntry::make('created_at')
                                                ->label('تاريخ الطلب')
                                                ->state(fn ($record) => $record?->created_at)
                                                ->dateTime('Y-m-d h:i A')
                                                ->color('gray'),
                                        ])
                                        ->columns(['sm' => 1, 'md' => 5]),
                                ])
                                ->collapsible()
                                ->collapsed()
                                ->visible(fn (User $record): bool => $record->hasRole('teacher') || PayoutRequest::where('user_id', $record->id)->exists()),
                        ])
                        ->modalSubmitAction(false)
                        ->modalCancelAction(fn (StaticAction $action) => $action->label('إغلاق')),
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

    public static function getRelations(): array
    {
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
