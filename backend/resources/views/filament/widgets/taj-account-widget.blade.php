<x-filament-widgets::widget>
    <x-filament::section>
        <div class="flex items-center gap-x-3">
            {{-- صورة المستخدم الافتراضية من Filament --}}
            <x-filament-panels::avatar.user size="lg" :user="auth()->user()" />
            
            <div class="flex-1">
                <h2 class="grid flex-1 text-base font-semibold leading-6 text-gray-950 dark:text-white">
                    مرحباً بك في منصة تاج التعليمية 👑
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    أهلاً بك، {{ auth()->user()->name }}
                </p>
            </div>
            
            {{-- زر تسجيل الخروج --}}
            <div class="flex items-center gap-x-4">
                <form action="{{ filament()->getLogoutUrl() }}" method="post">
                    @csrf
                    <x-filament::button color="gray" type="submit" size="sm">
                        تسجيل الخروج
                    </x-filament::button>
                </form>
            </div>
        </div>
    </x-filament::section>
</x-filament-widgets::widget>