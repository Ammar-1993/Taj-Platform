<div class="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col items-center gap-4 text-center">
    {{-- Security & SSL Trust Badge --}}
    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 shadow-sm text-xs font-medium text-slate-600 dark:text-slate-300">
        <svg class="w-3.5 h-3.5 text-emerald-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>اتصال مشفّر وآمن بتشفير 256-bit SSL</span>
    </div>

    {{-- Platform Links & Return to Frontend --}}
    <div class="flex items-center justify-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <a 
            href="{{ config('app.frontend_url', env('FRONTEND_URL', 'https://www.taj-edu.online')) }}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors"
        >
            <span>العودة إلى المنصة التعليمية</span>
            <svg class="w-3.5 h-3.5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
        </a>
        <span class="text-slate-300 dark:text-slate-700">•</span>
        <span class="text-slate-400 dark:text-slate-500">Taj Engine v2.1.0</span>
    </div>

    {{-- Copyright --}}
    <p class="text-[11px] text-slate-400 dark:text-slate-500">
        جميع الحقوق محفوظة &copy; {{ date('Y') }} منصة تاج التعليمية
    </p>
</div>
