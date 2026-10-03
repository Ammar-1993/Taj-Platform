<x-filament-widgets::widget class="fi-account-widget">
    <x-filament::section class="relative overflow-hidden transition-all duration-300 hover:shadow-md border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {{-- الجانب الأيمن: الصورة الرمزية وبيانات الترحيب --}}
            <div class="flex items-center gap-x-3.5">
                <a href="{{ route('filament.admin.auth.profile') }}" class="relative group block rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500" title="تحديث الصورة والملف الشخصي">
                    <div class="relative">
                        <x-filament-panels::avatar.user size="lg" :user="auth()->user()" class="h-12 w-12 rounded-full ring-2 ring-primary-500/30 group-hover:ring-primary-500 transition-all duration-200 object-cover shadow-sm" />
                        <span class="absolute bottom-0 end-0 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" title="متصل الآن"></span>
                    </div>
                </a>
                
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-x-2">
                        <h2 class="text-base font-bold leading-tight text-gray-950 dark:text-white truncate">
                            مرحباً بك في لوحة القيادة 👑
                        </h2>
                    </div>
                    
                    <div class="flex items-center gap-x-2 mt-1">
                        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                            {{ auth()->user()->name }}
                        </p>
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/40">
                            مدير النظام
                        </span>
                    </div>
                </div>
            </div>
            
            {{-- الجانب الأيسر: أزرار الإجراءات السريعة --}}
            <div class="flex items-center gap-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
                <x-filament::button
                    tag="a"
                    href="{{ route('filament.admin.auth.profile') }}"
                    color="gray"
                    icon="heroicon-m-user-circle"
                    size="sm"
                    class="font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
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
                        class="font-medium hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                    >
                        خروج
                    </x-filament::button>
                </form>
            </div>
            
        </div>
    </x-filament::section>
</x-filament-widgets::widget>