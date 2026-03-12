<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PayoutRequestResource\Pages;
use App\Models\PayoutRequest;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Actions\Action;

class PayoutRequestResource extends Resource
{
    protected static ?string $model = PayoutRequest::class;
    protected static ?string $navigationIcon = 'heroicon-o-banknotes';
    protected static ?string $modelLabel = 'طلب سحب';
    protected static ?string $pluralModelLabel = 'طلبات السحب';
    protected static ?string $navigationGroup = 'العمليات والمالية';

    public static function canCreate(): bool
    {
        return false; // المعلم هو من يطلب السحب من التطبيق، الإدارة توافق فقط
    }

    public static function form(Form $form): Form
    {
        return $form->schema([]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('المعلم (طالب السحب)')
                    ->searchable(),
                Tables\Columns\TextColumn::make('amount')
                    ->label('المبلغ المطلوب')
                    ->money('SAR')
                    ->sortable(),
                Tables\Columns\TextColumn::make('bank_name')
                    ->label('اسم البنك'),
                Tables\Columns\TextColumn::make('iban')
                    ->label('رقم الآيبان (IBAN)')
                    ->copyable() // إضافة زر لنسخ الايبان بسهولة
                    ->copyMessage('تم نسخ رقم الآيبان بنجاح'),
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
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                //
            ])
            ->actions([
                // 🟢 زر الموافقة
                Action::make('approve')
                    ->label('موافقة')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation() // رسالة تأكيد قبل التنفيذ
                    ->modalHeading('الموافقة على طلب السحب')
                    ->modalDescription('هل أنت متأكد من الموافقة على تحويل هذا المبلغ للمعلم؟')
                    ->visible(fn (PayoutRequest $record): bool => $record->status === 'pending')
                    ->action(fn (PayoutRequest $record) => $record->update(['status' => 'approved'])),

                // 🔴 زر الرفض
                Action::make('reject')
                    ->label('رفض')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalHeading('رفض طلب السحب')
                    ->form([
                        \Filament\Forms\Components\Textarea::make('admin_notes')
                            ->label('سبب الرفض')
                            ->required(),
                    ])
                    ->visible(fn (PayoutRequest $record): bool => $record->status === 'pending')
                    ->action(function (PayoutRequest $record, array $data) {
                        $record->update([
                            'status' => 'rejected',
                            'admin_notes' => $data['admin_notes'],
                        ]);
                        // ملاحظة: في بيئة الإنتاج، يجب هنا استدعاء WalletService 
                        // لإرجاع المبلغ لمحفظة المعلم لأنه تم رفض سحبه.
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
            'index' => Pages\ListPayoutRequests::route('/'),
        ];
    }
}