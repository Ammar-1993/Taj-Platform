<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SupportTicketResource\Pages;
use App\Models\SupportTicket;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Actions\Action;

class SupportTicketResource extends Resource
{
    protected static ?string $model = SupportTicket::class;
    protected static ?string $navigationIcon = 'heroicon-o-lifebuoy'; // أيقونة طوق النجاة (دعم فني)
    protected static ?string $modelLabel = 'تذكرة دعم فني';
    protected static ?string $pluralModelLabel = 'التذاكر والدعم';
    protected static ?string $navigationGroup = 'الإدارة والمستخدمين';
    protected static ?int $navigationSort = 4;

    public static function canCreate(): bool { return false; } // الطلاب هم من يفتح التذاكر

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('تفاصيل المشكلة')
                    ->schema([
                        Forms\Components\TextInput::make('user.name')->label('مقدم الطلب')->disabled(),
                        Forms\Components\TextInput::make('booking_id')->label('رقم الحجز المرتبط')->disabled(),
                        Forms\Components\TextInput::make('subject')->label('موضوع الشكوى')->disabled()->columnSpanFull(),
                        Forms\Components\Textarea::make('description')->label('التفاصيل')->disabled()->columnSpanFull(),
                    ])->columns(2),

                Forms\Components\Section::make('رد الإدارة')
                    ->schema([
                        Forms\Components\Textarea::make('admin_reply')
                            ->label('الرد على المستخدم')
                            ->disabled(),
                    ])->visible(fn ($record) => $record && $record->admin_reply !== null)
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')->label('رقم التذكرة')->sortable(),
                
                Tables\Columns\TextColumn::make('user.name')
                    ->label('المرسل')
                    ->searchable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('subject')
                    ->label('الموضوع')
                    ->searchable()
                    ->limit(40), // قص النص الطويل

                Tables\Columns\TextColumn::make('booking_id')
                    ->label('رقم الحجز')
                    ->badge()
                    ->color('info')
                    ->url(fn ($record) => $record->booking_id ? BookingResource::getUrl('index', ['tableSearch' => $record->booking_id]) : null) // 🟢 رابط ذكي يأخذ المدير لصفحة الحجوزات للبحث عن هذا الحجز!
                    ->placeholder('عام'),

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
                    }),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('وقت الفتح')
                    ->since()
                    ->sortable(),
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
                Tables\Actions\ViewAction::make()->label('قراءة التذكرة'),

                // 🟢 زر الرد وحل المشكلة
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
                            'status' => 'resolved', // تغيير الحالة إلى "تم الحل"
                        ]);

                        \Filament\Notifications\Notification::make()
                            ->title('تم إرسال الرد بنجاح ✅')
                            ->success()
                            ->send();
                    }),
            ])
            ->bulkActions([]);
    }

    public static function getRelations(): array { return []; }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSupportTickets::route('/'),
        ];
    }
}