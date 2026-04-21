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
                    ->formatStateUsing(fn ($state) => number_format((float) $state, 2) . ' SAR')
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
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'pending' => 'قيد المراجعة',
                        'approved' => 'معتمد',
                        'transferred' => 'تم التحويل',
                        'rejected' => 'مرفوض',
                        default => $state,
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
                Tables\Actions\ActionGroup::make([
                    // 🟢 1. زر الاعتماد (موافقة مبدئية)
                    Action::make('approve')
                        ->label('اعتماد')
                        ->icon('heroicon-o-check-circle')
                        ->color('info')
                        ->requiresConfirmation()
                        ->visible(fn (PayoutRequest $record): bool => $record->status === 'pending')
                        ->action(function (PayoutRequest $record) {
                            $record->update(['status' => 'approved']);
                            \Illuminate\Support\Facades\DB::table('notifications')->insert([
                                'id' => \Illuminate\Support\Str::uuid(),
                                'type' => 'App\Notifications\PayoutApprovedNotification',
                                'notifiable_type' => 'App\Models\User',
                                'notifiable_id' => $record->user_id,
                                'data' => json_encode([
                                    'type' => 'payout_approved',
                                    'message' => "تم اعتماد طلب السحب بمبلغ {$record->amount} ريال وسوف يتم تحويله قريباً.",
                                    'time' => now()->format('Y-m-d h:i A')
                                ]),
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }),

                    // 🟢 2. زر تم التحويل (إغلاق الطلب وإرسال إشعار) - ✨ محدث
                    Action::make('transfer')
                        ->label('تم التحويل البنكي')
                        ->icon('heroicon-o-currency-dollar')
                        ->color('success')
                        ->requiresConfirmation()
                        ->modalHeading('تأكيد التحويل البنكي')
                        ->modalDescription('هل قمت بتحويل المبلغ فعلياً لحساب المعلم؟ سيتم إغلاق الطلب وإرسال إشعار للمعلم.')
                        ->visible(fn (PayoutRequest $record): bool => $record->status === 'approved')
                        ->action(function (PayoutRequest $record) {
                            $record->update(['status' => 'transferred']);
                            
                            if (class_exists(\App\Notifications\PayoutProcessedNotification::class)) {
                                $record->user->notify(new \App\Notifications\PayoutProcessedNotification($record));
                            }
                            
                            \Filament\Notifications\Notification::make()
                                ->title('تم إغلاق الطلب بنجاح')
                                ->body('تم تغيير الحالة وإرسال إشعار للمعلم.')
                                ->success()
                                ->send();
                        }),

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
                                $record->update([
                                    'status' => 'rejected',
                                    'admin_notes' => $data['admin_notes'],
                                ]);
                                
                                $walletService = resolve(\App\Services\WalletService::class);
                                $walletService->processTransaction(
                                    $record->user,
                                    $record->amount,
                                    'deposit', 
                                    'استرجاع مبلغ طلب سحب مرفوض. السبب: ' . $data['admin_notes']
                                );

                                \Illuminate\Support\Facades\DB::table('notifications')->insert([
                                    'id' => \Illuminate\Support\Str::uuid(),
                                    'type' => 'App\Notifications\PayoutRejectedNotification',
                                    'notifiable_type' => 'App\Models\User',
                                    'notifiable_id' => $record->user_id,
                                    'data' => json_encode([
                                        'type' => 'payout_rejected',
                                        'message' => "تم رفض طلب السحب وإرجاع المبلغ لمحفظتك. السبب: {$data['admin_notes']}",
                                        'time' => now()->format('Y-m-d h:i A')
                                    ]),
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);

                                \Filament\Notifications\Notification::make()
                                    ->title('تم الرفض بنجاح')
                                    ->body('تم إرجاع المبلغ إلى محفظة المعلم.')
                                    ->success()
                                    ->send();
                            });
                        }),
                ])->icon('heroicon-m-ellipsis-vertical'),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    // 🚀 4. الإجراء الجماعي للمحاسبين (تحويل مجموعة طلبات دفعة واحدة) - ✨ جديد
                    Tables\Actions\BulkAction::make('markAsTransferredBulk')
                        ->label('تحديد كـ "تم التحويل"')
                        ->icon('heroicon-o-currency-dollar')
                        ->color('success')
                        ->requiresConfirmation()
                        ->modalHeading('تأكيد التحويل الجماعي')
                        ->modalDescription('سيتم تحويل حالة جميع الطلبات (المعتمدة) المحددة إلى "تم التحويل" وسيتم إرسال إشعار لكل معلم. هل أنت متأكد؟')
                        ->action(function (\Illuminate\Database\Eloquent\Collection $records) {
                            $processedCount = 0;
                            foreach ($records as $record) {
                                // نعالج فقط الطلبات التي تم اعتمادها مسبقاً
                                if ($record->status === 'approved') {
                                    $record->update(['status' => 'transferred']);
                                    
                                    if (class_exists(\App\Notifications\PayoutProcessedNotification::class)) {
                                        $record->user->notify(new \App\Notifications\PayoutProcessedNotification($record));
                                    }
                                    $processedCount++;
                                }
                            }
                            
                            \Filament\Notifications\Notification::make()
                                ->title("تمت العملية بنجاح!")
                                ->body("تم إغلاق {$processedCount} طلبات وإشعار أصحابها.")
                                ->success()
                                ->send();
                        })
                        ->deselectRecordsAfterCompletion(),
                ]),
            ]);
    }

    public static function getRelations(): array { return []; }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPayoutRequests::route('/'),
        ];
    }
}