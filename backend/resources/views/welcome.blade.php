<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>منصة تاج التعليمية</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        body { 
            font-family: 'Tajawal', sans-serif; 
            overflow: hidden; 
        }
        
        .animate-fade-in-up { animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(40px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes float {
            0% { transform: translateY(0px) rotate(3deg); }
            50% { transform: translateY(-15px) rotate(-1deg); }
            100% { transform: translateY(0px) rotate(3deg); }
        }

        .animate-blob { animation: blob 10s infinite alternate; }
        @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
    </style>
</head>
<body class="bg-slate-50 min-h-screen flex items-center justify-center p-4 relative">

    <div class="fixed inset-0 w-full h-full pointer-events-none z-0">
        <div class="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-purple-400/40 rounded-full mix-blend-multiply filter blur-[120px] animate-blob"></div>
        <div class="absolute top-[10%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-400/40 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-2000"></div>
        <div class="absolute bottom-[-10%] left-[20%] w-[30rem] h-[30rem] bg-blue-400/40 rounded-full mix-blend-multiply filter blur-[120px] animate-blob animation-delay-4000"></div>
    </div>
    
    <div class="relative z-10 w-full max-w-lg p-8 md:p-10 mx-4 backdrop-blur-2xl bg-white/60 border border-white/80 rounded-[3rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] animate-fade-in-up">

        <div class="w-28 h-28 mx-auto mb-8 bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 rounded-[2rem] flex items-center justify-center text-6xl shadow-[0_20px_40px_-15px_rgba(79,70,229,0.5)] animate-float border border-white/20">
            👑
        </div>
        
        <div class="flex justify-center items-center gap-3 mb-4">
            <h1 class="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-900 to-gray-900 tracking-tight pt-1">منصة تاج التعليمية</h1>
        </div>
        
        <div class="flex justify-center mb-10">
            <div class="inline-flex items-center gap-2.5 bg-white/80 border border-emerald-100/50 px-5 py-2.5 rounded-full shadow-sm backdrop-blur-sm">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span class="text-sm font-extrabold text-emerald-600 tracking-wide pt-0.5">ترحب بكم جميعاً</span>
            </div>
        </div>

        <div class="space-y-5">
            <a href="https://taj-platform.vercel.app" target="_blank" rel="noopener noreferrer" class="group relative flex items-center justify-center gap-3 w-full p-0.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:-translate-y-1">
                <div class="flex items-center justify-center gap-3 w-full px-6 py-4 bg-white/10 backdrop-blur-sm rounded-[15px] text-white font-black text-lg transition-all duration-300 group-hover:bg-transparent">
                    <span>الذهاب للمنصة</span>
                    <i data-lucide="rocket" class="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300"></i>
                </div>
            </a>
            
            <a href="/admin" target="_blank" rel="noopener noreferrer" class="group flex items-center justify-center gap-3 w-full px-6 py-4 bg-white/50 backdrop-blur-md border-2 border-indigo-50/50 text-indigo-900 font-bold rounded-2xl hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <span>دخول الإدارة</span>
                <i data-lucide="shield-check" class="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all"></i>
            </a>
        </div>

        <div class="mt-10 flex justify-between items-center text-xs font-bold text-gray-400 px-2">
            <span class="bg-white/50 px-3 py-1.5 rounded-lg border border-gray-100 backdrop-blur-sm">الإصدار 1.0.0</span>
            <span class="flex items-center gap-1.5 text-emerald-600 bg-emerald-50/80 px-3 py-1.5 rounded-lg border border-emerald-100 backdrop-blur-sm">
                بنية تحتية مؤمنة
                <i data-lucide="lock" class="w-3.5 h-3.5"></i>
            </span>
        </div>
    </div>

    <script>
        lucide.createIcons();
    </script>
</body>
</html>