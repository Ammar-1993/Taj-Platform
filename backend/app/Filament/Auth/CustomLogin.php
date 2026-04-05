<?php

namespace App\Filament\Auth;

use Filament\Forms\Components\Actions\Action;
use Filament\Forms\Components\Component;
use Filament\Forms\Components\TextInput;
use Filament\Pages\Auth\Login as BaseLogin;

class CustomLogin extends BaseLogin
{
    public bool $isPasswordVisible = false;

    protected function getEmailFormComponent(): Component
    {
        return TextInput::make('email')
            ->label(__('filament-panels::pages/auth/login.form.email.label'))
            ->email()
            ->required()
            ->autocomplete()
            ->autofocus()
            ->suffixIcon('heroicon-m-envelope') // Moved prefix to suffix (left in RTL)
            ->extraInputAttributes(['dir' => 'ltr', 'tabindex' => 1]);
    }

    protected function getPasswordFormComponent(): Component
    {
        return TextInput::make('password')
            ->label(__('filament-panels::pages/auth/login.form.password.label'))
            ->password(fn () => ! $this->isPasswordVisible)
            ->prefixAction(
                Action::make('togglePasswordVisibility')
                    ->icon(fn () => $this->isPasswordVisible ? 'heroicon-m-eye-slash' : 'heroicon-m-eye')
                    ->color('gray')
                    ->action(fn () => $this->isPasswordVisible = ! $this->isPasswordVisible)
            )
            ->suffixIcon('heroicon-m-lock-closed') // Moved prefix to suffix (left in RTL)
            ->autocomplete('current-password')
            ->required()
            ->extraInputAttributes(['dir' => 'ltr', 'tabindex' => 2]);
    }
}
