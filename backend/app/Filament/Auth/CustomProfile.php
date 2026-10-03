<?php

namespace App\Filament\Auth;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Form;
use Filament\Pages\Auth\EditProfile as BaseEditProfile;
use Illuminate\Contracts\Support\Htmlable;

class CustomProfile extends BaseEditProfile
{
    public function getHeading(): string|Htmlable
    {
        return 'إعدادات الحساب والملف الشخصي';
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Section::make('الصورة الشخصية والبيانات الأساسية')
                    ->description('يمكنك هنا تحديث صورتك الرمزية وبيانات حسابك الإداري.')
                    ->schema([
                        FileUpload::make('avatar_url')
                            ->label('الصورة الشخصية للمسؤول')
                            ->avatar()
                            ->image()
                            ->disk(config('filesystems.default', 'public'))
                            ->directory('avatars')
                            ->visibility('public')
                            ->imageEditor()
                            ->circleCropper()
                            ->maxSize(3072) // 3MB
                            ->alignCenter()
                            ->columnSpanFull(),

                        $this->getNameFormComponent()
                            ->label('اسم المسؤول'),

                        $this->getEmailFormComponent()
                            ->label('البريد الإلكتروني'),

                        TextInput::make('phone')
                            ->label('رقم الهاتف')
                            ->tel()
                            ->maxLength(20),
                    ])->columns(['sm' => 1, 'md' => 2]),

                Section::make('الأمان وتغيير كلمة المرور')
                    ->description('اترك الحقول فارغة إذا كنت ترغب في الاحتفاظ بكلمة المرور الحالية.')
                    ->schema([
                        $this->getPasswordFormComponent()
                            ->label('كلمة المرور الجديدة'),

                        $this->getPasswordConfirmationFormComponent()
                            ->label('تأكيد كلمة المرور الجديدة'),
                    ])->columns(['sm' => 1, 'md' => 2]),
            ]);
    }
}
