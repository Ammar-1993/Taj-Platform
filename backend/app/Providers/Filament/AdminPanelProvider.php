<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Support\Enums\MaxWidth;
use Filament\View\PanelsRenderHook;
use Filament\Widgets;
use App\Filament\Auth\CustomLogin;

use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\HtmlString;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->brandName('منصة تاج')
            ->brandLogo(fn () => new HtmlString('<div class="flex items-center gap-2"><span class="text-2xl">👑</span><span class="text-xl font-bold"></span></div>'))
            // ->brandLogo(asset('images/logo.png'))
            // ->brandLogoHeight('3rem')
            ->path('admin')
            ->login(CustomLogin::class)

            ->font('Cairo') // 🟢 هذه اللمسة ستجعل الخط العربي رائعاً
            ->colors([
                'primary' => Color::Indigo,
                'gray' => Color::Slate,
            ])
            ->spa() // 🚀 التحميل الفوري بدون تحديث الصفحة
            ->sidebarCollapsibleOnDesktop() // 📏 تحسين استغلال الشاشة الجانبية
            ->sidebarWidth('14rem')
            ->maxContentWidth(MaxWidth::Full) // 🖥️ تمديد المحتوى لاستغلال الشاشات الكبيرة
            ->globalSearchKeyBindings(['command+k', 'ctrl+k']) // ⌨️ اختصارات بحث لوحة المفاتيح
            ->renderHook(
                PanelsRenderHook::HEAD_END,
                fn (): HtmlString => new HtmlString('
                    <style>
                        /* إخفاء شريط التمرير مع الحفاظ على وظيفة التمرير */
                        * {
                            scrollbar-width: none; /* Firefox */
                        }
                        *::-webkit-scrollbar {
                            display: none; /* Chrome, Safari, Edge */
                        }
                        /* جعل حقول الإيميل وكلمة المرور تبدأ من اليسار */
                        input[type="email"], input[type="password"] {
                            direction: ltr !important;
                            text-align: left !important;
                        }
                        .fi-panels-login-page .fi-fo-field-wrp-label {
                            justify-content: flex-start !important;
                            text-align: left !important;
                        }
                    </style>
                ')
            )
            ->renderHook(
                PanelsRenderHook::TOPBAR_START,
                fn (): HtmlString => new HtmlString('
                    <div class="flex items-center gap-2 px-2 py-1 group cursor-default">
                        <span class="text-2xl drop-shadow-sm group-hover:scale-110 transition-transform">👑</span>
                        <span class="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400">منصة تاج التعليمية</span>
                    </div>
                ')
            )
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\\Filament\\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\\Filament\\Pages')
            ->pages([
                Pages\Dashboard::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\\Filament\\Widgets')
            ->widgets([
                // Widgets\AccountWidget::class,
                // Widgets\FilamentInfoWidget::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }
}
