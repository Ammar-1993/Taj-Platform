<x-filament-widgets::widget class="fi-info-widget">
    <x-filament::section class="relative overflow-hidden transition-all duration-300 hover:shadow-md border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {{-- الجانب الأيمن: أيقونة المنصة والبيانات الأساسية --}}
            <div class="flex items-center gap-x-3.5">
                <div class="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500/15 via-indigo-500/10 to-blue-500/20 text-primary-600 dark:text-primary-400 border border-primary-500/20 shadow-sm shrink-0">
                    <x-filament::icon
                        icon="heroicon-o-academic-cap"
                        class="h-6 w-6"
                    />
                </div>
                
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-x-2">
                        <h2 class="text-base font-bold leading-tight text-gray-950 dark:text-white truncate">
                            منصة تاج التعليمية
                        </h2>
                    </div>
                    
                    <div class="flex items-center gap-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span class="inline-flex items-center gap-1 font-mono font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                            v2.0.0
                        </span>
                        <span>•</span>
                        <span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                            النظام متصل
                        </span>
                    </div>
                </div>
            </div>
            
            {{-- الجانب الأيسر: زر زيارة الموقع --}}
            <div class="flex items-center gap-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
                <x-filament::button
                    tag="a"
                    href="{{ env('FRONTEND_URL', 'https://www.taj-edu.online') }}"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="primary"
                    icon="heroicon-m-arrow-top-right-on-square"
                    icon-position="after"
                    size="sm"
                    class="font-semibold shadow-sm"
                >
                    زيارة المنصة
                </x-filament::button>
            </div>
            
        </div>
    </x-filament::section>
</x-filament-widgets::widget>