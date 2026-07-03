<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BookingResource\Pages;
use App\Models\Booking;
use App\Services\BookingService;
use Carbon\Carbon;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
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
                        ->visible(fn (Booking $record): bool => in_array($record->status, ['scheduled', 'in_progress']))
                        ->action(function (Booking $record, array $data) {
                            try {
                                $bookingService = app(BookingService::class);
                                $bookingService->cancelBooking($record, Auth::user());

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
                ])->icon('heroicon-m-ellipsis-horizontal'),
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
