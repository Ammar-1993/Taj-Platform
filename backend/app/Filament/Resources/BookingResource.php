<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BookingResource\Pages;
use App\Models\Booking;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model; // 🟢 استدعاء كلاس الأكشن

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

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')->label('رقم الحجز')->sortable()->searchable()->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('student.name')->label('الطالب')->searchable()->weight('bold'),
                Tables\Columns\TextColumn::make('teacher.name')->label('المعلم')->searchable()->color('primary')->weight('bold'),
                Tables\Columns\TextColumn::make('booking_date')->label('تاريخ الحصة')->dateTime('Y-m-d h:i A')->sortable(),
                Tables\Columns\TextColumn::make('net_paid')->label('الصافي المدفوع')->money('SAR')->sortable()->badge()->color('success'),
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
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('تصفية حسب الحالة')
                    ->options([
                        'scheduled' => 'مجدول',
                        'in_progress' => 'قيد التنفيذ',
                        'completed' => 'مكتمل',
                        'cancelled' => 'ملغي',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()->label('تفاصيل'),

                // 🔴 زر التدخل الإداري القوي (Admin Override)
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
                    // الزر يظهر فقط للحصص التي لم تكتمل ولم تلغى بعد
                    ->visible(fn (Booking $record): bool => in_array($record->status, ['scheduled', 'in_progress']))
                    ->action(function (Booking $record, array $data) {
                        try {
                            // 1. استدعاء المحرك المالي الذي بنيناه سابقاً لضمان دقة العمليات
                            $bookingService = app(\App\Services\BookingService::class);

                            // نمرر المستخدم الحالي (المدير) كمنفذ لعملية الإلغاء
                            $bookingService->cancelBooking($record, \Illuminate\Support\Facades\Auth::user());

                            // يمكننا هنا إضافة كود لحفظ سبب الإلغاء $data['admin_reason'] في جدول ملاحظات أو إرساله كإشعار

                            \Filament\Notifications\Notification::make()
                                ->title('تم الإلغاء والاسترداد بنجاح ✅')
                                ->body('تم إرجاع المبلغ لمحفظة الطالب وتفريغ الموعد.')
                                ->success()
                                ->send();

                        } catch (\Exception $e) {
                            \Filament\Notifications\Notification::make()
                                ->title('فشل الإلغاء ❌')
                                ->body($e->getMessage())
                                ->danger()
                                ->send();
                        }
                    }),
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
