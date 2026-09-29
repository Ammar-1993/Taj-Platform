"use client";

import Link from "next/link";
import DecorativeBackground from "@/components/layout/DecorativeBackground";
import BrandEmblem from "@/components/ui/BrandEmblem";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, GraduationCap, Presentation, Users, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function RegisterHubPage() {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-hidden bg-slate-50/80">
      
      {/* خلفية تجميلية محيطية وشبكة نقطية */}
      <DecorativeBackground />

      <div className="text-center max-w-3xl mb-10 animate-fade-up relative z-10 flex flex-col items-center">
        {/* الشعار الملكي الفاخر */}
        <BrandEmblem size="lg" className="mb-4" />
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-50/90 text-indigo-700 border border-indigo-100 shadow-sm mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>انضمام جديد إلى منصة تاج</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          مرحباً بك في منصة تاج التعليمية
          </h1>
        <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl">
          اختر نوع الحساب الذي ترغب في إنشائه لنقوم بتوجيهك للمسار الصحيح المخصص لتجربتك
        </p>
      </div>

      {/* بطاقات تحديد مسار الحساب (3 Role Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full relative z-10">
        
        {/* 1. بطاقة الطالب */}
        <Link
          href="/register/student"
          className="group animate-fade-up block h-full select-none"
          style={{ animationDelay: "0.05s" }}
        >
          <Card
            variant="glass"
            className="p-7 sm:p-8 border-2 border-white/80 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/15 transition-all duration-400 text-center h-full flex flex-col justify-between items-center hover:-translate-y-2 overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl relative"
          >
            {/* خط التدرج العلوي */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-90 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex flex-col items-center w-full">
              {/* شارة التمييز */}
              <span className="mb-4 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100/80">
                للطلاب والمستفيدين
              </span>

              {/* أيقونة المسار في حاوية فاخرة */}
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-5 group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-2">طالب</h2>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-5 min-h-[40px]">
                أريد أن أتعلم، أحجز حصصاً تفاعلية، وأطور من مهاراتي مع نخبة المعلمين المعتمدين.
              </p>

              {/* مزايا المسار */}
              <div className="w-full space-y-2 text-right mb-6 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>حصص فردية وجماعية مباشرة</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>فصول تفاعلية ذكية وسبورة متطورة</span>
                </div>
              </div>
            </div>

            {/* زر اتخاذ الإجراء */}
            <div className="w-full py-2.5 px-4 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-sm">
              <span>إنشاء حساب طالب</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>

        {/* 2. بطاقة المعلم */}
        <Link
          href="/register/teacher"
          className="group animate-fade-up block h-full select-none"
          style={{ animationDelay: "0.1s" }}
        >
          <Card
            variant="glass"
            className="p-7 sm:p-8 border-2 border-white/80 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/15 transition-all duration-400 text-center h-full flex flex-col justify-between items-center hover:-translate-y-2 overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl relative"
          >
            {/* خط التدرج العلوي */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-90 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex flex-col items-center w-full">
              {/* شارة التمييز */}
              <span className="mb-4 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100/80">
                عائد مالي يصل إلى 80%
              </span>

              {/* أيقونة المسار في حاوية فاخرة */}
              <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-5 group-hover:scale-110 transition-transform duration-300">
                <Presentation className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-2">معلم / خبير</h2>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-5 min-h-[40px]">
                أريد الانضمام لفريق تاج، تقديم حصص تفاعلية، وتحقيق دخل مجزٍ ومستدام.
              </p>

              {/* مزايا المسار */}
              <div className="w-full space-y-2 text-right mb-6 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>عائد مالي فوري مع سحب أرباح مرن</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>حرية كاملة في تحديد الجداول والأسعار</span>
                </div>
              </div>
            </div>

            {/* زر اتخاذ الإجراء */}
            <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-sm">
              <span>إنشاء حساب معلم</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>

        {/* 3. بطاقة ولي الأمر */}
        <Link
          href="/register/parent"
          className="group animate-fade-up block h-full select-none"
          style={{ animationDelay: "0.15s" }}
        >
          <Card
            variant="glass"
            className="p-7 sm:p-8 border-2 border-white/80 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/15 transition-all duration-400 text-center h-full flex flex-col justify-between items-center hover:-translate-y-2 overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl relative"
          >
            {/* خط التدرج العلوي */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-violet-600 opacity-90 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex flex-col items-center w-full">
              {/* شارة التمييز */}
              <span className="mb-4 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100/80">
                إدارة عائلية متكاملة
              </span>

              {/* أيقونة المسار في حاوية فاخرة */}
              <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 mb-5 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-2">ولي أمر</h2>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-5 min-h-[40px]">
                أريد إدارة حسابات أبنائي، شحن محافظهم، ومتابعة تطورهم الدراسي بكل يسر.
              </p>

              {/* مزايا المسار */}
              <div className="w-full space-y-2 text-right mb-6 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <span>محفظة عائلية وإدارة مصاريف الحصص</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <span>تقارير تقدم الحضور والتحصيل الدراسي</span>
                </div>
              </div>
            </div>

            {/* زر اتخاذ الإجراء */}
            <div className="w-full py-2.5 px-4 rounded-xl bg-purple-50 group-hover:bg-purple-600 text-purple-700 group-hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-sm">
              <span>إنشاء حساب ولي أمر</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>
      </div>

      {/* كبسولة رابط تسجيل الدخول */}
      <div className="mt-10 text-center animate-fade-in-up-delay-2 relative z-10 bg-white/75 backdrop-blur-md px-6 py-3.5 rounded-2xl border border-white/80 shadow-sm transition-all hover:bg-white/90">
        <p className="text-slate-600 font-medium text-sm">
          لديك حساب بالفعل؟{" "}
          <Link
            href="/login"
            className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors underline-offset-4 hover:underline mr-1"
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>

      {/* شارة الأمان والموثوقية */}
      <div className="mt-8 flex items-center gap-2 text-center select-none text-xs text-slate-400 font-medium">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>تسجيل فوري ومجاني • حماية البيانات مشفرة 256-bit SSL</span>
      </div>
      
    </div>
  );
}
