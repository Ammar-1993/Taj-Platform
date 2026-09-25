<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BookingResource\Pages;
use App\Models\Booking;
use App\Services\BookingService;
use Carbon\Carbon;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Support\Enums\FontFamily;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

// 🟢 استدعاء كلاس الأكشن

class BookingResource extends Resource
{
    protected static ?string $model = Booking::class;

    protected static ?string $navigationIcon = 'heroicon-o-calendar-days';

    protected static ?string $modelLabel = 'حجز';

    protected static ?string $pluralModelLabel = 'سجل الحجوزات';

    protected static ?string $navigationGroup = 'العمليات والمالية';

    protected static ?int $navigationSort = 1;

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canEdit(Model $record): bool
    {
        return false;
    }

    public static function form(Form $form): Form
    {
        return $form->schema([]);
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Infolists\Components\Section::make('معلومات الحصة والأطراف')
                    ->schema([
                        Infolists\Components\TextEntry::make('id')
                            ->label('رقم الحجز')
                            ->badge()
                            ->color('gray'),
                        Infolists\Components\TextEntry::make('student.name')
                            ->label('الطالب')
                            ->weight('bold'),
                        Infolists\Components\TextEntry::make('teacher.name')
                            ->label('المعلم')
                            ->color('primary')
                            ->weight('bold'),
                        Infolists\Components\TextEntry::make('bookedBy.name')
                            ->label('تم الدفع بواسطة')
                            ->placeholder('الطالب نفسه'),
                        Infolists\Components\TextEntry::make('booking_date')
                            ->label('تاريخ الحصة')
                            ->date('Y-m-d'),
                        Infolists\Components\TextEntry::make('time_slot')
                            ->label('التوقيت')
                            ->state(fn (Booking $record): string => ($record->teacherSlot?->start_time ?? '-').' إلى '.($record->teacherSlot?->end_time ?? '-')),
                        Infolists\Components\TextEntry::make('status')
                            ->label('الحالة الحالية')
                            ->badge()
                            ->color(fn (string $state): string => match ($state) {
                                'scheduled' => 'info',
                                'in_progress' => 'warning',
                                'completed' => 'success',
                                'cancelled', 'refunded' => 'danger',
                                'abandoned' => 'gray',
                                default => 'gray',
                            })
                            ->formatStateUsing(fn (string $state): string => match ($state) {
                                'scheduled' => 'مجدول',
                                'in_progress' => 'قيد التنفيذ',
                                'completed' => 'مكتمل',
                                'cancelled' => 'ملغي',
                                'refunded' => 'مسترجع',
                                'abandoned' => 'مهجورة',
                                default => $state,
                            }),
                    ])->columns(['sm' => 1, 'md' => 2, 'lg' => 3]),

                Infolists\Components\Section::make('البيانات المالية ونظام الضمان (Escrow)')
                    ->schema([
                        Infolists\Components\TextEntry::make('session_price')
                            ->label('سعر الجلسة الأصلي')
                            ->formatStateUsing(fn ($state) => number_format((float) $state, 2).' SAR'),
                        Infolists\Components\TextEntry::make('discount_amount')
                            ->label('الخصم المطبق')
                            ->formatStateUsing(fn ($state) => number_format((float) $state, 2).' SAR'),
                        Infolists\Components\TextEntry::make('net_paid')
                            ->label('الصافي المدفوع من المحفظة')
                            ->badge()
                            ->color('success')
                            ->formatStateUsing(fn ($state) => number_format((float) $state, 2).' SAR'),
                        Infolists\Components\TextEntry::make('teacher_share')
                            ->label('مستحقات المعلم (80%)')
                            ->color('primary')
                            ->state(fn (Booking $record): string => number_format((float) ($record->net_paid * 0.8), 2).' SAR'),
                        Infolists\Components\TextEntry::make('platform_fee')
                            ->label('عمولة المنصة (20%)')
                            ->color('gray')
                            ->state(fn (Booking $record): string => number_format((float) ($record->net_paid * 0.2), 2).' SAR'),
                    ])->columns(['sm' => 1, 'md' => 2, 'lg' => 3])
                    ->collapsible()
                    ->collapsed(),

                Infolists\Components\Section::make('سجل الحضور والبث المباشر')
                    ->schema([
                        Infolists\Components\TextEntry::make('teacher_joined_at')
                            ->label('وقت انضمام المعلم')
                            ->dateTime('Y-m-d h:i:s A')
                            ->placeholder('لم ينضم بعد'),
                        Infolists\Components\TextEntry::make('student_joined_at')
                            ->label('وقت انضمام الطالب')
                            ->dateTime('Y-m-d h:i:s A')
                            ->placeholder('لم ينضم بعد'),
                        Infolists\Components\TextEntry::make('completed_at')
                            ->label('وقت اكتمال الحصة')
                            ->dateTime('Y-m-d h:i:s A')
                            ->placeholder('لم تكتمل بعد'),
                        Infolists\Components\TextEntry::make('agora_channel')
                            ->label('قناة البث (Agora Channel)')
                            ->copyable()
                            ->copyMessage('تم نسخ اسم القناة بنجاح')
                            ->fontFamily(FontFamily::Mono)
                            ->icon('heroicon-o-video-camera')
                            ->placeholder('-')
                            ->columnSpanFull(),
                        Infolists\Components\TextEntry::make('whiteboard_room_uuid')
                            ->label('معرف غرفة السبورة (Netless UUID)')
                            ->copyable()
                            ->copyMessage('تم نسخ معرف السبورة بنجاح')
                            ->fontFamily(FontFamily::Mono)
                            ->icon('heroicon-o-presentation-chart-bar')
                            ->placeholder('لا توجد سبورة')
                            ->columnSpanFull(),
                    ])->columns(['sm' => 1, 'md' => 2, 'lg' => 3])
                    ->collapsible()
                    ->collapsed(),

                Infolists\Components\Section::make('القرارات والملاحظات الإدارية')
                    ->schema([
                        Infolists\Components\TextEntry::make('metadata.cancellation_reason')
                            ->label('سبب الإلغاء / الاسترجاع')
                            ->placeholder('لا يوجد')
                            ->color('danger'),
                        Infolists\Components\TextEntry::make('metadata.admin_completion_note')
                            ->label('ملاحظة الاعتماد الإداري')
                            ->placeholder('لا يوجد')
                            ->color('success'),
                        Infolists\Components\TextEntry::make('metadata.cancelled_at')
                            ->label('تاريخ الإلغاء')
                            ->dateTime('Y-m-d h:i A')
                            ->placeholder('-'),
                    ])->columns(['sm' => 1, 'md' => 2, 'lg' => 3])
                    ->collapsible()
                    ->collapsed()
                    ->visible(fn (Booking $record): bool => ! empty($record->metadata)),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')->label('رقم الحجز')->sortable()->searchable()->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('student.name')->label('الطالب')->searchable()->weight('bold'),
                Tables\Columns\TextColumn::make('teacher.name')->label('المعلم')->searchable()->color('primary')->weight('bold'),
                Tables\Columns\TextColumn::make('booking_date')->label('تاريخ الحصة')->dateTime('Y-m-d h:i A')->sortable(),
                Tables\Columns\TextColumn::make('net_paid')->label('الصافي المدفوع')->formatStateUsing(fn ($state) => number_format((float) $state, 2).' SAR')->sortable()->badge()->color('success'),
                Tables\Columns\TextColumn::make('status')
                    ->label('الحالة')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'scheduled' => 'info',
                        'in_progress' => 'warning',
                        'completed' => 'success',
                        'cancelled', 'refunded' => 'danger',
                        'abandoned' => 'gray',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'scheduled' => 'مجدول',
                        'in_progress' => 'قيد التنفيذ',
                        'completed' => 'مكتمل',
                        'cancelled' => 'ملغي',
                        'refunded' => 'مسترجع',
                        'abandoned' => 'مهجورة',
                        default => $state,
                    }),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('تصفية حسب الحالة')
                    ->options([
                        'scheduled' => 'مجدول',
                        'in_progress' => 'قيد التنفيذ',
                        'completed' => 'مكتمل',
                        'cancelled' => 'ملغي',
                        'abandoned' => 'مهجورة',
                    ]),
                Tables\Filters\Filter::make('booking_date')
                    ->form([
                        Forms\Components\DatePicker::make('booked_from')
                            ->label('تاريخ الحصة من'),
                        Forms\Components\DatePicker::make('booked_until')
                            ->label('تاريخ الحصة إلى'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query
                            ->when(
                                $data['booked_from'],
                                fn (Builder $query, $date): Builder => $query->whereDate('booking_date', '>=', $date),
                            )
                            ->when(
                                $data['booked_until'],
                                fn (Builder $query, $date): Builder => $query->whereDate('booking_date', '<=', $date),
                            );
                    })
                    ->indicateUsing(function (array $data): array {
                        $indicators = [];
                        if ($data['booked_from'] ?? null) {
                            $indicators['booked_from'] = 'من: '.Carbon::parse($data['booked_from'])->toFormattedDateString();
                        }
                        if ($data['booked_until'] ?? null) {
                            $indicators['booked_until'] = 'إلى: '.Carbon::parse($data['booked_until'])->toFormattedDateString();
                        }

                        return $indicators;
                    }),
            ])
            ->actions([
                Tables\Actions\ActionGroup::make([
                    Tables\Actions\ViewAction::make()
                        ->label('تفاصيل')
                        ->modalHeading('تفاصيل الحجز')
                        ->modalWidth('3xl'),

                    // 🟢 اعتماد وصرف الأرباح للمعلم (يظهر في القائمة للحصص المهجورة فقط)
                    Action::make('approve_abandoned')
                        ->label('اعتماد للمعلم')
                        ->icon('heroicon-o-check-badge')
                        ->color('success')
                        ->requiresConfirmation()
                        ->modalHeading('اعتماد الحصة وصرف أرباح المعلم 🎓')
                        ->modalDescription(fn (Booking $record): string => "بعد المراجعة الإدارية، سيتم اعتبار الحصة المهجورة رقم #{$record->id} مكتملة وتحويل نسبة المعلم (80% = ".number_format((float) ($record->net_paid * 0.8), 2).' SAR) إلى محفظة الأستاذ ('.($record->teacher?->name ?? 'المعلم').'). هل أنت متأكد؟')
                        ->form([
                            Forms\Components\Textarea::make('admin_note')
                                ->label('ملاحظة الاعتماد الإداري')
                                ->required()
                                ->default('تم التحقق الإداري واعتماد إتمام الحصة وتحرير مستحقات المعلم من الضمان المالي')
                                ->placeholder('مثال: تم التأكد من حضور المعلم وتقديم الحصة للطرفين...'),
                        ])
                        ->visible(fn (Booking $record): bool => $record->status === 'abandoned')
                        ->action(function (Booking $record, array $data) {
                            try {
                                $bookingService = app(BookingService::class);
                                $bookingService->completeBooking($record, Auth::user(), $data['admin_note']);

                                Notification::make()
                                    ->title('تم اعتماد الحصة وصرف الأرباح ✅')
                                    ->body('تم تحويل أرباح الحصة ('.number_format((float) ($record->net_paid * 0.8), 2).' SAR) إلى محفظة المعلم بنجاح.')
                                    ->success()
                                    ->send();

                            } catch (\Exception $e) {
                                Notification::make()
                                    ->title('فشل الاعتماد ❌')
                                    ->body($e->getMessage())
                                    ->danger()
                                    ->send();
                            }
                        }),

                    // 🔴 استرجاع مالي للطالب (يظهر في القائمة للحصص المهجورة فقط)
                    Action::make('refund_abandoned')
                        ->label('استرجاع للطالب')
                        ->icon('heroicon-o-arrow-uturn-left')
                        ->color('danger')
                        ->requiresConfirmation()
                        ->modalHeading('استرجاع مالي لحصة مهجورة 💰')
                        ->modalDescription(fn (Booking $record): string => "سيتم إلغاء الحصة المهجورة رقم #{$record->id} وإعادة كامل المبلغ المدفوع (".number_format((float) $record->net_paid, 2).' SAR) إلى محفظة دافع الحجز ('.($record->bookedBy?->name ?? 'الطالب').'). هل ترغب بالتأكيد؟')
                        ->form([
                            Forms\Components\Textarea::make('admin_reason')
                                ->label('سبب الاسترجاع (للسجلات الإدارية)')
                                ->required()
                                ->default('إلغاء واسترجاع مالي بقرار إداري نظراً لتعثر الحصة وإغلاقها كمهجورة')
                                ->placeholder('مثال: تعذر استمرار الحصة بسبب خلل تقني أو عدم حضور أحد الأطراف...'),
                        ])
                        ->visible(fn (Booking $record): bool => $record->status === 'abandoned')
                        ->action(function (Booking $record, array $data) {
                            try {
                                $bookingService = app(BookingService::class);
                                $bookingService->cancelBooking($record, Auth::user(), $data['admin_reason']);

                                Notification::make()
                                    ->title('تم الاسترجاع بنجاح ✅')
                                    ->body('تمت إعادة المبلغ كاملاً ('.number_format((float) $record->net_paid, 2).' SAR) إلى محفظة الطالب وتحديث الحجز إلى ملغي.')
                                    ->success()
                                    ->send();

                            } catch (\Exception $e) {
                                Notification::make()
                                    ->title('فشل الاسترجاع ❌')
                                    ->body($e->getMessage())
                                    ->danger()
                                    ->send();
                            }
                        }),

                    // 🔴 زر التدخل الإداري القوي (Admin Override) للحصص المجدولة أو قيد التنفيذ
                    Action::make('force_cancel_refund')
                        ->label('إلغاء واسترداد مالي (Refund)')
                        ->icon('heroicon-o-shield-exclamation')
                        ->color('danger')
                        ->requiresConfirmation()
                        ->modalHeading('التدخل الإداري لحل نزاع ⚖️')
                        ->modalDescription('سيتم إلغاء هذه الحصة فوراً، وإرجاع المبلغ كاملاً لمحفظة الطالب (Refund)، وسيصبح الموعد متاحاً لمعلمين آخرين. هل أنت متأكد؟')
                        ->form([
                            Forms\Components\Textarea::make('admin_reason')
                                ->label('سبب الإلغاء (للسجلات الإدارية)')
                                ->required()
                                ->placeholder('مثال: المعلم لم يحضر الحصة، أو خلل فني في الإنترنت...'),
                        ])
                        ->visible(fn (Booking $record): bool => in_array($record->status, ['scheduled', 'in_progress']))
                        ->action(function (Booking $record, array $data) {
                            try {
                                $bookingService = app(BookingService::class);
                                $bookingService->cancelBooking($record, Auth::user(), $data['admin_reason']);

                                Notification::make()
                                    ->title('تم الإلغاء والاسترداد بنجاح ✅')
                                    ->body('تم إرجاع المبلغ لمحفظة الطالب وتفريغ الموعد.')
                                    ->success()
                                    ->send();

                            } catch (\Exception $e) {
                                Notification::make()
                                    ->title('فشل الإلغاء ❌')
                                    ->body($e->getMessage())
                                    ->danger()
                                    ->send();
                            }
                        }),
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
            'index' => Pages\ListBookings::route('/'),
        ];
    }
}
