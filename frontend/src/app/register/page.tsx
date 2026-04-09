"use client";

import Link from "next/link";
import DecorativeBackground from "@/components/ui/DecorativeBackground";

export default function RegisterHubPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-hidden">
      <DecorativeBackground />

      <div className="text-center max-w-3xl mb-12 animate-fade-in-up">
        <Link
          href="/"
          className="inline-block mb-4 text-5xl hover:scale-110 transition-transform duration-200 drop-shadow-lg animate-subtle-pulse">
          👑
        </Link>
        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
          مرحباً بك في منصة تاج
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed">
          اختر نوع الحساب الذي ترغب في إنشائه لنقوم بتوجيهك للمسار الصحيح
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {/* 1. بطاقة الطالب */}
        <Link
          href="/register/student"
          className="group animate-fade-in-up"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-100/80 hover:shadow-2xl transition-all duration-300 text-center h-full flex flex-col justify-center items-center cursor-pointer hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-blue-400 to-indigo-500"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-200 shadow-sm">
              🎓
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">طالب</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              أريد أن أتعلم، أحجز حصصاً، وأطور من مهاراتي مع نخبة من المعلمين.
            </p>
            <span className="mt-6 inline-block bg-gradient-to-l from-blue-600 to-indigo-600 text-white font-extrabold py-2.5 px-6 rounded-xl group-hover:shadow-lg transition-all duration-200 text-sm">
              إنشاء حساب طالب
            </span>
          </div>
        </Link>

        {/* 2. بطاقة المعلم */}
        <Link
          href="/register/teacher"
          className="group animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-100/80 hover:shadow-2xl transition-all duration-300 text-center h-full flex flex-col justify-center items-center cursor-pointer hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-emerald-400 to-green-500"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-emerald-50 text-green-600 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-200 shadow-sm">
              👨‍🏫
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              معلم / خبير
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              أريد الانضمام لفريق تاج، تقديم حصص تفاعلية، وتحقيق دخل إضافي.
            </p>
            <span className="mt-6 inline-block bg-gradient-to-l from-green-600 to-emerald-600 text-white font-extrabold py-2.5 px-6 rounded-xl group-hover:shadow-lg transition-all duration-200 text-sm">
              الانضمام كمعلم
            </span>
          </div>
        </Link>

        {/* 3. بطاقة ولي الأمر */}
        <Link
          href="/register/parent"
          className="group animate-fade-in-up"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-100/80 hover:shadow-2xl transition-all duration-300 text-center h-full flex flex-col justify-center items-center cursor-pointer hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-purple-400 to-violet-500"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-violet-50 text-purple-600 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-200 shadow-sm">
              👨‍👩‍👦
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">ولي أمر</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              أريد إدارة حسابات أبنائي، شحن محافظهم، ومتابعة تطورهم الدراسي.
            </p>
            <span className="mt-6 inline-block bg-gradient-to-l from-purple-600 to-violet-600 text-white font-extrabold py-2.5 px-6 rounded-xl group-hover:shadow-lg transition-all duration-200 text-sm">
              حساب ولي أمر
            </span>
          </div>
        </Link>
      </div>

      <div className="mt-12 text-center animate-fade-in-up-delay-2">
        <p className="text-gray-500 font-medium">
          لديك حساب بالفعل؟{" "}
          <Link
            href="/login"
            className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
