"use client";

import Link from "next/link";
import DecorativeBackground from "@/components/layout/DecorativeBackground";
import { Card } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

export default function RegisterHubPage() {
  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-hidden bg-slate-50">
      
      {/* استدعاء الخلفية التجميلية بشكل سليم */}
      <DecorativeBackground />

      <div className="text-center max-w-3xl mb-10 animate-fade-up relative z-10">
        {/* الشعار قابل للنقر ويوجه للصفحة الرئيسية */}
        <Link
          href="/"
          className="inline-block mb-3 text-5xl hover:scale-110 transition-transform duration-300 drop-shadow-xl cursor-pointer"
          title="العودة للصفحة الرئيسية"
        >
          👑
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
          مرحباً بك في منصة تاج التعليمية
        </h1>
        <p className="text-base text-gray-500 font-medium">
          اختر نوع الحساب الذي ترغب في إنشائه لنقوم بتوجيهك للمسار الصحيح
        </p>
      </div>

      {/* تقليل المسافات (gap-6) لضمان ظهور البطاقات في شاشة واحدة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full relative z-10">
        
        {/* 1. بطاقة الطالب */}
        <Link
          href="/register/student"
          className="group animate-fade-up block h-full"
          style={{ animationDelay: "0.05s" }}
        >
          <Card variant="glass" className="p-8 border-2 border-transparent hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 text-center h-full flex flex-col justify-center items-center hover:-translate-y-2 overflow-hidden bg-white/60 backdrop-blur-md">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-l from-indigo-500 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50 text-indigo-600 rounded-3xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm group-hover:shadow-indigo-100">
              🎓
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">طالب</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-1">
              أريد أن أتعلم، أحجز حصصاً، وأطور من مهاراتي مع نخبة المعلمين.
            </p>
            
            <div className="mt-auto flex items-center gap-2 text-indigo-600 font-bold text-sm group-hover:gap-3 transition-all duration-300">
              <span>إنشاء حساب طالب</span>
              <ArrowLeft className="w-4 h-4" />
            </div>
          </Card>
        </Link>

        {/* 2. بطاقة المعلم */}
        <Link
          href="/register/teacher"
          className="group animate-fade-up block h-full"
          style={{ animationDelay: "0.1s" }}
        >
          <Card variant="glass" className="p-8 border-2 border-transparent hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 text-center h-full flex flex-col justify-center items-center hover:-translate-y-2 overflow-hidden bg-white/60 backdrop-blur-md">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-l from-emerald-500 to-green-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100/50 text-emerald-600 rounded-3xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm group-hover:shadow-emerald-100">
              👨‍🏫
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">معلم / خبير</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-1">
              أريد الانضمام لفريق تاج، تقديم حصص تفاعلية، وتحقيق دخل إضافي.
            </p>
            
            <div className="mt-auto flex items-center gap-2 text-emerald-600 font-bold text-sm group-hover:gap-3 transition-all duration-300">
              <span>إنشاء حساب معلم</span>
              <ArrowLeft className="w-4 h-4" />
            </div>
          </Card>
        </Link>

        {/* 3. بطاقة ولي الأمر */}
        <Link
          href="/register/parent"
          className="group animate-fade-up block h-full"
          style={{ animationDelay: "0.15s" }}
        >
          <Card variant="glass" className="p-8 border-2 border-transparent hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 text-center h-full flex flex-col justify-center items-center hover:-translate-y-2 overflow-hidden bg-white/60 backdrop-blur-md">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-l from-purple-500 to-violet-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100/50 text-purple-600 rounded-3xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm group-hover:shadow-purple-100">
              👨‍👩‍👦
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ولي أمر</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-1">
              أريد إدارة حسابات أبنائي، شحن محافظهم، ومتابعة تطورهم الدراسي.
            </p>
            
            <div className="mt-auto flex items-center gap-2 text-purple-600 font-bold text-sm group-hover:gap-3 transition-all duration-300">
              <span>إنشاء حساب ولي أمر</span>
              <ArrowLeft className="w-4 h-4" />
            </div>
          </Card>
        </Link>
      </div>

      <div className="mt-10 text-center animate-fade-in-up-delay-2 relative z-10 bg-white/40 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/50 shadow-sm">
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
