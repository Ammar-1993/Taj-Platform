<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>منصة تاج | الخادم الخلفي (API)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Cairo', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 min-h-screen flex items-center justify-center p-4">
    
    <div class="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-fade-in">
        
        <div class="bg-gradient-to-r from-indigo-600 to-blue-500 p-8 text-center relative overflow-hidden">
            <div class="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mt-10 -mr-10"></div>
            <div class="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -mb-10 -ml-10"></div>
            
            <div class="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 transform rotate-3 hover:rotate-0 transition duration-300 relative z-10">
                <span class="text-4xl">👑</span>
            </div>
            <h1 class="text-3xl font-extrabold text-white mb-2 relative z-10">منصة تاج التعليمية</h1>
            <p class="text-indigo-100 font-medium relative z-10">المحرك الخلفي وواجهة برمجة التطبيقات (API)</p>
        </div>

        <div class="p-8">
            <div class="flex items-center justify-center gap-3 mb-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 font-bold">
                <span class="relative flex h-4 w-4">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
                <span>النظام يعمل بكفاءة ومستعد لاستقبال الطلبات</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="https://taj-platform.vercel.app" target="_blank" class="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-indigo-50 rounded-2xl border border-slate-200 hover:border-indigo-300 transition group text-center cursor-pointer shadow-sm hover:shadow-md">
                    <span class="text-3xl mb-3 group-hover:scale-110 group-hover:-translate-y-1 transition transform duration-300">🌐</span>
                    <h3 class="text-lg font-bold text-slate-800">المنصة الرئيسية</h3>
                    <p class="text-sm text-slate-500 mt-1">واجهة الطلاب والمعلمين</p>
                </a>

                <a href="/admin" class="flex flex-col items-center justify-center p-6 bg-slate-50 hover:bg-blue-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition group text-center cursor-pointer shadow-sm hover:shadow-md">
                    <span class="text-3xl mb-3 group-hover:scale-110 group-hover:-translate-y-1 transition transform duration-300">🛡️</span>
                    <h3 class="text-lg font-bold text-slate-800">لوحة الإدارة</h3>
                    <p class="text-sm text-slate-500 mt-1">التحكم الشامل وإدارة المنصة</p>
                </a>
            </div>

            <div class="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-400">
                <p>⚠️ هذا الخادم مخصص لمعالجة البيانات ولا يحتوي على واجهات عامة.</p>
                <p class="mt-2 font-semibold">Taj Platform &copy; {{ date('Y') }}</p>
            </div>
        </div>
    </div>

</body>
</html>