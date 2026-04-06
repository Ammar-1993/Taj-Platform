<x-filament-widgets::widget>
    <x-filament::section>
        <div class="flex items-center justify-between gap-x-3">
            <div class="flex items-center gap-x-3">
                {{-- أيقونة مخصصة --}}
                <x-filament::icon
                    icon="heroicon-o-academic-cap"
                    class="h-8 w-8 text-primary-500"
                />
                <div class="flex-1">
                    <h2 class="text-base font-semibold leading-6 text-gray-950 dark:text-white">
                        منصة تاج التعليمية
                    </h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        الإصدار 1.0.0
                    </p>
                </div>
            </div>
            
            <div class="flex flex-col items-end gap-y-1">
                <a href="/" target="_blank" class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                    زيارة الموقع &rarr;
                </a>
            </div>
        </div>
    </x-filament::section>
</x-filament-widgets::widget>