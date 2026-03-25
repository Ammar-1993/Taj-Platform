<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PayoutRequestResource\Pages;
use App\Models\PayoutRequest;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Actions\Action;
use Illuminate\Support\Facades\DB;

class PayoutRequestResource extends Resource
{
    protected static ?string $model = PayoutRequest::class;
    protected static ?string $navigationIcon = 'heroicon-o-banknotes';
    protected static ?string $modelLabel = 'طلب سحب';
    protected static ?string $pluralModelLabel = 'طلبات السحب';
    protected static ?string $navigationGroup = 'العمليات والمالية';
    protected static ?int $navigationSort = 2;

    public static function canCreate(): bool { return false; }

    public static function form(Form $form): Form { return $form->schema([]); }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('المعلم (طالب السحب)')
                    ->searchable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('amount')
                    ->label('المبلغ المطلوب')
                    ->money('SAR')
                    ->sortable()
                    ->badge()
                    ->color('success'),

                Tables\Columns\TextColumn::make('bank_name')
                    ->label('البنك'),

                // 🟢 تم الإخفاء الافتراضي للآيبان لتجنب شريط التمرير المزعج
                Tables\Columns\TextColumn::make('iban')
                    ->label('الآيبان (IBAN)')
                    ->copyable()
                    ->copyMessage('تم النسخ بنجاح!')
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('status')
                    ->label('الحالة')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pending' => 'warning',
                        'approved' => 'info',
                        'transferred' => 'success',
                        'rejected' => 'danger',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('تاريخ الطلب')
                    ->since() // عرض "منذ يومين" بدلاً من تاريخ طويل
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('الحالة')
                    ->options([
                        'pending' => 'قيد المراجعة',
                        'approved' => 'معتمد',
                        'transferred' => 'تم التحويل',
                        'rejected' => 'مرفوض',
                    ]),
            ])
            ->actions([
                // 🟢 1. زر الاعتماد (موافقة مبدئية)
                Action::make('approve')
                    ->label('اعتماد')
                    ->icon('heroicon-o-check-circle')
                    ->color('info')
                    ->requiresConfirmation()
                    ->visible(fn (PayoutRequest $record): bool => $record->status === 'pending')
                    ->action(fn (PayoutRequest $record) => $record->update(['status' => 'approved'])),

                // 🟢 2. زر تم التحويل (إغلاق الطلب)
                Action::make('transfer')
                    ->label('تم التحويل البنكي')
                    ->icon('heroicon-o-currency-dollar')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (PayoutRequest $record): bool => $record->status === 'approved')
                    ->action(fn (PayoutRequest $record) => $record->update(['status' => 'transferred'])),

                // 🔴 3. زر الرفض (وإرجاع المال الفعلي)
                Action::make('reject')
                    ->label('رفض وإرجاع الرصيد')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->form([
                        \Filament\Forms\Components\Textarea::make('admin_notes')
                            ->label('سبب الرفض (سيظهر للمعلم)')
                            ->required(),
                    ])
                    ->visible(fn (PayoutRequest $record): bool => $record->status === 'pending')
                    ->action(function (PayoutRequest $record, array $data) {
                        DB::transaction(function () use ($record, $data) {
                            // 1. تحديث حالة الطلب
                            $record->update([
                                'status' => 'rejected',
                                'admin_notes' => $data['admin_notes'],
                            ]);
                            
                            // 2. إرجاع المبلغ لمحفظة المعلم باستخدام الخدمة المالية التي بنيناها
                            $walletService = resolve(\App\Services\WalletService::class);
                            $walletService->processTransaction(
                                $record->user,
                                $record->amount,
                                'deposit', // إيداع
                                'استرجاع مبلغ طلب سحب مرفوض. السبب: ' . $data['admin_notes']
                            );
                        });
                    }),
            ])
            ->bulkActions([]);
    }

    public static function getRelations(): array { return []; }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPayoutRequests::route('/'),
        ];
    }
}