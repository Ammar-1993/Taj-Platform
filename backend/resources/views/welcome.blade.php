<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>منصة تاج التعليمية</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        body { font-family: 'Tajawal', sans-serif; }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center p-4">

 <div class="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-indigo-600 to-blue-500 transform -skew-y-6 -translate-y-24 shadow-2xl z-0"></div>
    
    <div class="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100 relative overflow-hidden animate-fade-in-up">
        
        <div class="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full opacity-50 blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-50 rounded-full opacity-50 blur-3xl"></div>

        <div class="relative z-10">
            <div class="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-5xl shadow-lg transform rotate-3 hover:rotate-0 transition duration-300">
                👑
            </div>
            
            <h1 class="text-3xl font-extrabold text-gray-900 mb-2">منصة تاج التعليمية</h1>
            
            <div class="inline-flex items-center gap-2 bg-green-50 border border-green-100 px-4 py-2 rounded-full mb-8">
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span class="text-sm font-bold text-green-700">ترحب بكم جميعاً</span>
            </div>

            <div class="space-y-4">
                <a href="https://taj-platform.vercel.app" class="flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-700 hover:-translate-y-1 transition duration-200 shadow-md hover:shadow-lg">
                    <span>الذهاب للمنصة الرئيسية</span>
                    <span>🚀</span>
                </a>
                
                <a href="/admin" class="flex items-center justify-center gap-2 w-full bg-gray-50 text-gray-700 font-bold py-3.5 px-4 rounded-xl hover:bg-gray-100 hover:-translate-y-1 transition duration-200 border border-gray-200">
                    <span>دخول الإدارة (Filament)</span>
                    <span>🛡️</span>
                </a>
            </div>

            <div class="mt-8 pt-6 border-t border-gray-50 text-xs text-gray-400 font-medium flex justify-between items-center">
                <span>الإصدار 1.0.0</span>
                <span>بنية تحتية مؤمنة 🔒</span>
            </div>
        </div>
    </div>

</body>
</html>