<x-filament-widgets::widget class="fi-account-widget">
    <x-filament::section class="relative overflow-hidden transition-all duration-300 hover:shadow-md border border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl">
        <div class="flex items-center justify-between gap-x-3">
            
            {{-- الجانب الأيمن: الصورة الرمزية والبيانات --}}
            <div class="flex items-center gap-x-3 min-w-0">
                <a href="{{ route('filament.admin.auth.profile') }}" 
                   class="relative group shrink-0 block rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500" 
                   title="الملف الشخصي">
                    <x-filament-panels::avatar.user 
                        size="lg" 
                        :user="auth()->user()" 
                        class="h-11 w-11 rounded-full ring-2 ring-primary-500/25 group-hover:ring-primary-500 transition-all duration-200 object-cover shadow-sm" />
                    <span class="absolute bottom-0 end-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900"></span>
                </a>
                
                <div class="min-w-0">
                    <p class="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">
                        مرحباً بك في لوحة التحكم 👑
                    </p>
                    <h2 class="text-sm font-bold text-gray-900 dark:text-white truncate leading-snug mt-0.5">
                        {{ auth()->user()->name }}
                    </h2>
                </div>
            </div>
            
            {{-- الجانب الأيسر: أزرار الإجراءات --}}
            <div class="flex items-center gap-x-2 shrink-0">
                <x-filament::button
                    tag="a"
                    href="{{ route('filament.admin.auth.profile') }}"
                    color="gray"
                    icon="heroicon-m-user-circle"
                    size="sm"
                >
                    الملف الشخصي
                </x-filament::button>

                <form action="{{ filament()->getLogoutUrl() }}" method="post" class="inline-block">
                    @csrf
                    <x-filament::button 
                        color="gray" 
                        type="submit" 
                        icon="heroicon-m-arrow-right-on-rectangle"
                        size="sm"
                    >
                        خروج
                    </x-filament::button>
                </form>
            </div>
            
        </div>
    </x-filament::section>
</x-filament-widgets::widget>