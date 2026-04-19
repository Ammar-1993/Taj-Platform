<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SupportTicketResource\Pages;
use App\Models\SupportTicket;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Table;

class SupportTicketResource extends Resource
{
    protected static ?string $model = SupportTicket::class;

    protected static ?string $navigationIcon = 'heroicon-o-lifebuoy';

    protected static ?string $modelLabel = 'تذكرة دعم فني';

    protected static ?string $pluralModelLabel = 'التذاكر والدعم';

    protected static ?string $navigationGroup = 'الإدارة والمستخدمين';

    protected static ?int $navigationSort = 4;

    public static function canCreate(): bool
    {
        return false;
    } 

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('تفاصيل المشكلة')
                    ->schema([
                        Forms\Components\Placeholder::make('user_name')
                            ->label('مقدم الطلب')
                            ->content(fn ($record) => $record?->user?->name ?? 'غير معروف'),

                        Forms\Components\Placeholder::make('booking_info')
                            ->label('رقم الحجز المرتبط')
                            ->content(fn ($record) => $record?->booking_id ? 'حجز رقم #'.$record->booking_id : 'شكوى عامة (لا يوجد حجز)'),

                        Forms\Components\TextInput::make('subject')
                            ->label('موضوع الشكوى')
                            ->disabled()
                            ->columnSpanFull(),

                        Forms\Components\Textarea::make('description')
                            ->label('التفاصيل')
                            ->disabled()
                            ->columnSpanFull(),
                    ])->columns(['sm' => 1, 'md' => 2]),

                Forms\Components\Section::make('رد الإدارة')
                    ->schema([
                        Forms\Components\Textarea::make('admin_reply')
                            ->label('الرد على المستخدم')
                            ->disabled(),
                    ])->visible(fn ($record) => $record && $record->admin_reply !== null),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                // 🟢 مخفي افتراضياً لتوفير المساحة
                Tables\Columns\TextColumn::make('id')
                    ->label('رقم التذكرة')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('المرسل')
                    ->searchable()
                    ->weight('bold')
                    ->toggleable(), // قابل للإخفاء

                Tables\Columns\TextColumn::make('subject')
                    ->label('الموضوع')
                    ->searchable()
                    ->limit(40)
                    ->toggleable(),

                Tables\Columns\TextColumn::make('booking_id')
                    ->label('رقم الحجز')
                    ->badge()
                    ->color('info')
                    ->url(fn ($record) => $record->booking_id ? BookingResource::getUrl('index', ['tableSearch' => $record->booking_id]) : null)
                    ->placeholder('عام')
                    ->visibleFrom('md'),

                Tables\Columns\TextColumn::make('status')
                    ->label('الحالة')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'open' => 'danger',
                        'in_progress' => 'warning',
                        'resolved', 'closed' => 'success',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'open' => 'مفتوحة (جديدة)',
                        'in_progress' => 'قيد المعالجة',
                        'resolved' => 'تم الحل',
                        'closed' => 'مغلقة',
                        default => $state,
                    })
                    ->toggleable(),

                // 🟢 مخفي افتراضياً
                Tables\Columns\TextColumn::make('created_at')
                    ->label('وقت الفتح')
                    ->since()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('الحالة')
                    ->options([
                        'open' => 'مفتوحة',
                        'in_progress' => 'قيد المعالجة',
                        'resolved' => 'تم الحل',
                    ]),
            ])
            ->actions([
                Tables\Actions\ActionGroup::make([
                    Tables\Actions\ViewAction::make()->label('قراءة التذكرة'),

                    Action::make('reply')
                        ->label('الرد والإغلاق')
                        ->icon('heroicon-o-chat-bubble-left-ellipsis')
                        ->color('success')
                        ->visible(fn (SupportTicket $record): bool => in_array($record->status, ['open', 'in_progress']))
                        ->form([
                            Forms\Components\Textarea::make('admin_reply')
                                ->label('اكتب ردك للطالب (سيظهر له في لوحة التحكم)')
                                ->required()
                                ->rows(4),
                        ])
                        ->action(function (SupportTicket $record, array $data) {
                            $record->update([
                                'admin_reply' => $data['admin_reply'],
                                'status' => 'resolved', 
                            ]);

                            \Filament\Notifications\Notification::make()
                                ->title('تم إرسال الرد بنجاح ✅')
                                ->success()
                                ->send();
                        }),

                    Action::make('mark_resolved')
                        ->label('إغلاق بدون رد')
                        ->icon('heroicon-o-check')
                        ->color('gray')
                        ->requiresConfirmation()
                        ->visible(fn (SupportTicket $record): bool => in_array($record->status, ['open', 'in_progress']) && empty($record->admin_reply))
                        ->action(function (SupportTicket $record) {
                            $record->update(['status' => 'resolved']);
                            \Filament\Notifications\Notification::make()
                                ->title('تم إغلاق التذكرة ✅')
                                ->success()
                                ->send();
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
            'index' => Pages\ListSupportTickets::route('/'),
        ];
    }
}