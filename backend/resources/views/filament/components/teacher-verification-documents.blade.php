@php
    $record = $getRecord() ?? ($record ?? null);
    $disk = \Illuminate\Support\Facades\Storage::disk(config('filesystems.default', 'public'));

    // 1. معالجة وثيقة الهوية الوطنية
    $idPath = $record?->national_id_path;
    $idUrl = $idPath ? $disk->url($idPath) : null;
    $idExt = $idPath ? strtolower(pathinfo($idPath, PATHINFO_EXTENSION)) : '';
    $idIsImage = in_array($idExt, ['jpg', 'jpeg', 'png', 'webp', 'gif']);
    $idIsPdf = ($idExt === 'pdf');
    $idSize = null;
    if ($idPath) {
        try {
            $bytes = $disk->size($idPath);
            $idSize = $bytes >= 1048576 
                ? number_format($bytes / 1048576, 1) . ' MB' 
                : number_format($bytes / 1024, 0) . ' KB';
        } catch (\Throwable) {
            $idSize = null;
        }
    }

    // 2. معالجة وثيقة الشهادة الجامعية / الأكاديمية
    $degreePath = $record?->degree_path;
    $degreeUrl = $degreePath ? $disk->url($degreePath) : null;
    $degreeExt = $degreePath ? strtolower(pathinfo($degreePath, PATHINFO_EXTENSION)) : '';
    $degreeIsImage = in_array($degreeExt, ['jpg', 'jpeg', 'png', 'webp', 'gif']);
    $degreeIsPdf = ($degreeExt === 'pdf');
    $degreeSize = null;
    if ($degreePath) {
        try {
            $bytes = $disk->size($degreePath);
            $degreeSize = $bytes >= 1048576 
                ? number_format($bytes / 1048576, 1) . ' MB' 
                : number_format($bytes / 1024, 0) . ' KB';
        } catch (\Throwable) {
            $degreeSize = null;
        }
    }

    $documents = [
        [
            'key' => 'national_id',
            'title' => 'صورة الهوية الوطنية',
            'icon_type' => 'id_card',
            'path' => $idPath,
            'url' => $idUrl,
            'ext' => $idExt,
            'size' => $idSize,
            'is_image' => $idIsImage,
            'is_pdf' => $idIsPdf,
            'accent_color' => 'amber',
        ],
        [
            'key' => 'degree',
            'title' => 'الشهادة الجامعية / الأكاديمية',
            'icon_type' => 'academic_cap',
            'path' => $degreePath,
            'url' => $degreeUrl,
            'ext' => $degreeExt,
            'size' => $degreeSize,
            'is_image' => $degreeIsImage,
            'is_pdf' => $degreeIsPdf,
            'accent_color' => 'indigo',
        ],
    ];
@endphp

<div class="w-full">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        @foreach ($documents as $doc)
            <div class="group relative flex flex-col justify-between rounded-xl border border-gray-200/80 bg-white/80 p-3.5 shadow-sm transition-all duration-200 hover:border-primary-500/40 hover:shadow-md dark:border-white/10 dark:bg-gray-900/60 dark:shadow-inner">
                
                {{-- 🟢 الشريط العلوي الموحد للبطاقة --}}
                <div class="flex items-center justify-between gap-2 border-b border-gray-100 pb-3 dark:border-white/10">
                    <div class="flex items-center gap-2 min-w-0">
                        @if ($doc['icon_type'] === 'id_card')
                            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400">
                                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                                </svg>
                            </div>
                        @else
                            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 dark:bg-indigo-400/10 dark:text-indigo-400">
                                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                                </svg>
                            </div>
                        @endif

                        <div class="truncate">
                            <h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {{ $doc['title'] }}
                            </h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400 truncate font-mono">
                                {{ $doc['path'] ? basename($doc['path']) : 'غير مرفوع' }}
                            </p>
                        </div>
                    </div>

                    {{-- شارات الملف وأزرار التحميل/المعاينة --}}
                    @if ($doc['path'] && $doc['url'])
                        <div class="flex items-center gap-1.5 shrink-0">
                            {{-- شارة الامتداد --}}
                            @if ($doc['is_pdf'])
                                <span class="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                                    PDF
                                </span>
                            @else
                                <span class="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 uppercase">
                                    {{ $doc['ext'] ?: 'IMG' }}
                                </span>
                            @endif

                            {{-- شارة الحجم --}}
                            @if ($doc['size'])
                                <span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300 font-mono">
                                    {{ $doc['size'] }}
                                </span>
                            @endif

                            {{-- زر التحميل المباشر --}}
                            <a 
                                href="{{ $doc['url'] }}" 
                                download="{{ basename($doc['path']) }}"
                                title="تحميل المستند"
                                class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 hover:text-primary-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                            >
                                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                            </a>

                            {{-- زر الفتح في تاب جديد --}}
                            <a 
                                href="{{ $doc['url'] }}" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                title="فتح في تبويب جديد"
                                class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 hover:text-primary-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                            >
                                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                            </a>
                        </div>
                    @endif
                </div>

                {{-- 🖼️ جسم البطاقة (منطقة المعاينة المتطابقة الأبعاد) --}}
                <div class="mt-3 relative flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-50/80 border border-gray-200/60 dark:bg-black/40 dark:border-white/5">
                    @if ($doc['path'] && $doc['url'])
                        @if ($doc['is_image'])
                            {{-- 📷 عرض الصورة المصغرة مع تأثير التكبير عند التحويم --}}
                            <a 
                                href="{{ $doc['url'] }}" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                class="group/img relative flex h-full w-full items-center justify-center overflow-hidden"
                            >
                                <img 
                                    src="{{ $doc['url'] }}" 
                                    alt="{{ $doc['title'] }}" 
                                    class="max-h-full max-w-full object-contain p-2 transition-transform duration-300 group-hover/img:scale-105"
                                    loading="lazy"
                                />
                                {{-- طبقة التحويم اللطيفة للمعاينة --}}
                                <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover/img:opacity-100">
                                    <span class="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow-lg backdrop-blur dark:bg-gray-900/90 dark:text-white">
                                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        معاينة مكبرة
                                    </span>
                                </div>
                            </a>
                        @elseif ($doc['is_pdf'])
                            {{-- 📄 عرض بطاقة مستند PDF تفاعلية وأنيقة تملأ كامل المساحة --}}
                            <div class="relative flex h-full w-full flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-rose-500/5 to-transparent dark:from-rose-500/10 dark:to-transparent">
                                <div class="relative mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20 shadow-sm dark:bg-rose-500/20 dark:text-rose-400">
                                    <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                    <span class="absolute -bottom-1 -right-1 rounded-md bg-rose-600 px-1 text-[9px] font-black uppercase text-white shadow">
                                        PDF
                                    </span>
                                </div>

                                <p class="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                    مستند أكاديمي رقمي معتمد
                                </p>
                                <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                    جاهز للمراجعة والتحقق المباشر
                                </p>

                                <a 
                                    href="{{ $doc['url'] }}" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    class="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500 hover:shadow-rose-600/30 active:scale-95"
                                >
                                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                    </svg>
                                    فتح وقراءة المستند (PDF)
                                </a>
                            </div>
                        @else
                            {{-- 📁 مستند من نوع آخر --}}
                            <div class="flex flex-col items-center justify-center p-4 text-center">
                                <svg class="h-10 w-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                <a 
                                    href="{{ $doc['url'] }}" 
                                    target="_blank" 
                                    class="mt-2 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
                                >
                                    فتح واستعراض الملف
                                </a>
                            </div>
                        @endif
                    @else
                        {{-- ⚠️ حالة عدم الرفع --}}
                        <div class="flex flex-col items-center justify-center p-4 text-center text-gray-400 dark:text-gray-500">
                            <svg class="h-9 w-9 mb-1" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <span class="text-xs font-medium">لم يتم رفع هذا المستند بعد</span>
                        </div>
                    @endif
                </div>

                {{-- 🔒 الشريط السفلي الأمني المتطابق --}}
                <div class="mt-3 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-100 pt-2.5 dark:border-white/5">
                    <span class="inline-flex items-center gap-1.5 font-medium">
                        <span class="h-1.5 w-1.5 rounded-full {{ $doc['path'] ? 'bg-emerald-500' : 'bg-amber-500' }}"></span>
                        {{ $doc['path'] ? 'مستند موثق وسليم' : 'بانتظار الرفع' }}
                    </span>
                    <span class="font-mono text-[10px] text-gray-400 dark:text-gray-500">
                        Cloudflare R2 Storage
                    </span>
                </div>

            </div>
        @endforeach
    </div>
</div>
