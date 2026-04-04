"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function FAQPage() {
  const { user } = useAuth();

  const faqs = [
    {
      q: "كيف أبدأ بحجز حصتي الأولى؟",
      a: "ببساطة اختر مادة من الصفحة الرئيسية، تصفح قائمة المعلمين المتاحين، اختر المعلم المناسب، ثم حدد موعداً من جدوله وأكمل عملية الحجز.",
      icon: "🚀",
    },
    {
      q: "ماذا أفعل إذا لم يحضر المعلم في الموعد؟",
      a: "في حال عدم حضور المعلم، يمكنك رفع تذكرة دعم فني من لوحة التحكم فوراً. سنقوم بالتحقق واسترداد المبلغ لمحفظتك أو إعادة جدولة الحصة حسب رغبتك.",
      icon: "⏳",
    },
    {
      q: "كيف يمكنني شحن رصيد محفظتي؟",
      a: "من لوحة التحكم (Dashboard)، اضغط على زر 'شحن المحفظة'. يمكنك استخدام وسائل الدفع المتاحة لشحن رصيدك والبدء بالحجز فوراً.",
      icon: "💳",
    },
    {
      q: "هل يمكنني إلغاء الحصة واسترجاع المبلغ؟",
      a: "نعم، يمكنك إلغاء الحصة قبل موعدها بفترة كافية (حسب سياسة المنصة) وسيتم استرجاع المبلغ لمحفظتك تلقائياً. في حال الإلغاء المتأخر قد يتم تطبيق رسوم بسيطة.",
      icon: "🔄",
    },
    {
      q: "كيف أتواصل مع المعلم قبل الحصة؟",
      a: "يمكنك عرض ملف المعلم الشخصي ومعرفة تفاصيل خبرته. التواصل المباشر يتم حالياً عبر الفصل الافتراضي عند بدء موعد الحصة المجدول.",
      icon: "💬",
    },
    {
      q: "كيف يتم ضمان جودة التعليم في المنصة؟",
      a: "نحن نقوم بمراجعة دقيقة لملفات المعلمين وخبراتهم، كما نعتمد على تقييمات الطلاب الحقيقية بعد كل حصة لضمان أفضل تجربة تعليمية.",
      icon: "⭐",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50/50 p-4 md:p-8">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-0 opacity-20">
        <div className="absolute top-[15%] -left-20 w-96 h-96 rounded-full bg-indigo-300 blur-[130px]"></div>
        <div className="absolute bottom-[25%] -right-20 w-[500px] h-[500px] rounded-full bg-purple-200 blur-[160px]"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-12 py-10 md:py-16">
        {/* Header Section */}
        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black tracking-widest uppercase mb-2">
            <span>مركز المساعدة</span>
            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
            الأسئلة الشائعة <span className="text-indigo-600">(FAQ)</span>
          </h1>
          <p className="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            كل ما تحتاجه من أجوبة لتبدأ رحلتك التعليمية مع منصة تاج بكل سهولة ويسر.
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up-delay">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="group bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-xl border border-white/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                  {faq.icon}
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="text-xl font-black text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors">
                    {faq.q}
                  </h3>
                  <p className="text-gray-500 font-bold leading-relaxed text-sm">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-[3rem] shadow-2xl border border-white/50 text-center space-y-6 animate-fade-in-up-delay-2 max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">لم تجد إجابة لسؤالك؟</h2>
          <p className="text-gray-500 font-medium">فريق الدعم الفني متاح دائماً لمساعدتك في أي استفسار آخر.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <Link
              href={user ? "/dashboard/support" : "/login"}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-black rounded-2xl hover:shadow-[0_10px_40px_rgba(79,70,229,0.3)] transition-all duration-300 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>تواصل مع الدعم</span>
              <span>🎧</span>
            </Link>
            <Link
              href="/"
              className="px-8 py-4 bg-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>العودة للرئيسية</span>
              <span>🏠</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
