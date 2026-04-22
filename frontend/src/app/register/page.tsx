"use client";

import Link from "next/link";
import DecorativeBackground from "@/components/ui/DecorativeBackground";

export default function RegisterHubPage() {
  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-hidden bg-slate-50">
      
      {/* استدعاء الخلفية التجميلية بشكل سليم */}
      <DecorativeBackground />

      <div className="text-center max-w-3xl mb-8 animate-fade-in-up relative z-10">
        {/* الشعار قابل للنقر ويوجه للصفحة الرئيسية */}
        <Link
          href="/"
          className="inline-block mb-3 text-5xl hover:scale-110 transition-transform duration-300 drop-shadow-xl cursor-pointer"
          title="العودة للصفحة الرئيسية"
        >
          👑
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
          مرحباً بك في منصة تاج
        </h1>
        <p className="text-base text-gray-500 font-medium">
          اختر نوع الحساب الذي ترغب في إنشائه لنقوم بتوجيهك للمسار الصحيح
        </p>
      </div>

      {/* تقليل المسافات (gap-5) لضمان ظهور البطاقات في شاشة واحدة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl w-full relative z-10">
        
        {/* 1. بطاقة الطالب */}
        <Link
          href="/register/student"
          className="group animate-fade-in-up block h-full"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_10px_40px_rgba(8,112,184,0.05)] border border-white hover:border-indigo-100 hover:shadow-2xl transition-all duration-300 text-center h-full flex flex-col justify-center items-center hover:-translate-y-1.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-l from-indigo-500 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
              🎓
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1.5">طالب</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1">
              أريد أن أتعلم، أحجز حصصاً، وأطور من مهاراتي مع نخبة المعلمين.
            </p>
            <span className="w-full inline-block bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 text-white font-bold py-2.5 px-4 rounded-xl group-hover:shadow-[0_8px_20px_rgba(79,70,229,0.25)] transition-all duration-300 text-sm">
              حساب طالب
            </span>
          </div>
        </Link>

        {/* 2. بطاقة المعلم */}
        <Link
          href="/register/teacher"
          className="group animate-fade-in-up block h-full"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_10px_40px_rgba(8,112,184,0.05)] border border-white hover:border-emerald-100 hover:shadow-2xl transition-all duration-300 text-center h-full flex flex-col justify-center items-center hover:-translate-y-1.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-l from-emerald-500 to-green-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100/50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
              👨‍🏫
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1.5">معلم / خبير</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1">
              أريد الانضمام لفريق تاج، تقديم حصص تفاعلية، وتحقيق دخل إضافي.
            </p>
            <span className="w-full inline-block bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 text-white font-bold py-2.5 px-4 rounded-xl group-hover:shadow-[0_8px_20px_rgba(16,185,129,0.25)] transition-all duration-300 text-sm">
              حساب معلم
            </span>
          </div>
        </Link>

        {/* 3. بطاقة ولي الأمر */}
        <Link
          href="/register/parent"
          className="group animate-fade-in-up block h-full"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_10px_40px_rgba(8,112,184,0.05)] border border-white hover:border-purple-100 hover:shadow-2xl transition-all duration-300 text-center h-full flex flex-col justify-center items-center hover:-translate-y-1.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-l from-purple-500 to-violet-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100/50 text-purple-600 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
              👨‍👩‍👦
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1.5">ولي أمر</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1">
              أريد إدارة حسابات أبنائي، شحن محافظهم، ومتابعة تطورهم الدراسي.
            </p>
            <span className="w-full inline-block bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 text-white font-bold py-2.5 px-4 rounded-xl group-hover:shadow-[0_8px_20px_rgba(147,51,234,0.25)] transition-all duration-300 text-sm">
              حساب ولي أمر
            </span>
          </div>
        </Link>
      </div>

      <div className="mt-8 text-center animate-fade-in-up-delay-2 relative z-10 bg-white/40 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/50 shadow-sm">
        <p className="text-gray-600 font-medium text-sm">
          لديك حساب بالفعل؟{" "}
          <Link
            href="/login"
            className="text-indigo-700 hover:text-indigo-900 font-bold transition-colors ml-1"
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>
      
    </div>
  );
}