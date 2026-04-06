"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function FAQPage() {
  const { user } = useAuth();

  // 🟢 تم تنظيم الأسئلة في أقسام (Categories) لتسهيل القراءة وتصغير حجم الخطوط
  const faqCategories = [
    {
      title: "🚀 البداية والاستخدام",
      faqs: [
        {
          q: "كيف أبدأ بحجز حصتي الأولى؟",
          a: "ببساطة اختر مادة من الصفحة الرئيسية، تصفح قائمة المعلمين المتاحين، اختر المعلم المناسب، ثم حدد موعداً من جدوله وأكمل عملية الحجز.",
          icon: "🎯",
        },
        {
          q: "ما هي المتطلبات التقنية لحضور الفصل الافتراضي؟",
          a: "لا حاجة لتحميل أي برامج معقدة! كل ما تحتاجه هو جهاز حاسوب أو حاسوب محمول أو جهاز لوحي متصل بإنترنت مستقر، ومتصفح حديث (مثل Google Chrome أو Safari).",
          icon: "💻",
        },
      ]
    },
    {
      title: "💰 الأمان المالي وضمان الحقوق",
      faqs: [
        {
          q: "كيف أضمن حقي المالي بعد شحن المحفظة وحجز الحصة؟",
          a: "في منصة 'تاج'، نستخدم نظام 'التجميد الآمن' (Escrow). عند حجزك لحصة، لا يتم تحويل المبلغ للمعلم مباشرة، بل يبقى مجمداً وآمناً في نظام المنصة. لا يتم تحويل الرصيد إلى محفظة المعلم إلا بعد انتهاء الحصة الافتراضية بنجاح وتأكيد الحضور. أموالك دائماً في أمان!",
          icon: "🔐",
        },
        {
          q: "ماذا يحدث إذا انقطع الإنترنت لدي أو لدى المعلم أثناء الحصة؟",
          a: "نحن نتفهم المشاكل التقنية الخارجة عن الإرادة. إذا كان الانقطاع من طرف المعلم ولم تكتمل الحصة، يتم إعادة المبلغ إلى محفظتك فوراً لجدولة حصة أخرى. أما إذا كان الانقطاع من طرف الطالب، فيمكن التواصل مع المعلم عبر المنصة لتعويض الوقت المتبقي بالتراضي، فمعلمونا شركاء في نجاح أبنائكم.",
          icon: "📡",
        },
        {
          q: "كيف تعمل أكواد الخصم؟ وهل تؤثر على جودة الحصة؟",
          a: "إطلاقاً! جودة التعليم خط أحمر. عندما نطلق أكواد خصم ترويجية للطلاب، يتم تقاسم تكلفة هذا الخصم بين أرباح المنصة وجزء بسيط من أرباح المعلم بناءً على اتفاقية مسبقة وعادلة بنسبة مئوية (مثلاً: تتحمل المنصة الجزء الأكبر من التخفيض لدعم المعلم). المعلم يحصل على حقه، والطالب يحصل على تعليم ممتاز بسعر أقل!",
          icon: "🎟️",
        },
        {
          q: "ما هي وسائل الدفع المتاحة لشحن المحفظة؟",
          a: "نحن نوفر خيارات دفع آمنة ومتعددة تشمل: البطاقات الائتمانية (فيزا، ماستركارد)، مدى (Mada)، أبل باي (Apple Pay)، بالإضافة إلى التحويل البنكي المباشر لضمان راحتك.",
          icon: "💳",
        },
      ]
    },
    {
      title: "👨‍👩‍👧‍👦 متابعة ولي الأمر وتعدد الأبناء",
      faqs: [
        {
          q: "كيف يمكنني متابعة أداء ابني ومستواه مع المعلمين؟",
          a: "لقد صممنا لوحة تحكم خاصة بـ 'ولي الأمر'. يمكنك من خلالها متابعة سجل حضور وغياب ابنك، والاطلاع على التقييمات والملاحظات التي يكتبها المعلمون بعد كل حصة، بالإضافة إلى تتبع رصيد المحفظة والمدفوعات بكل شفافية.",
          icon: "📊",
        },
        {
          q: "لدي أكثر من ابن في مراحل دراسية مختلفة، هل أحتاج لحسابات متعددة؟",
          a: "راحتكم تهمنا! لا تحتاج سوى لحساب 'ولي أمر' واحد ومحفظة مالية واحدة. يمكنك إضافة جميع أبنائك كـ 'ملفات شخصية' (Profiles) فرعية تحت حسابك، واستخدام نفس المحفظة لحجز حصص مختلفة لكل ابن على حدة بكل سهولة.",
          icon: "👨‍👧‍👦",
        },
      ]
    },
    {
      title: "⭐ جودة التعليم وتقييم الأداء",
      faqs: [
        {
          q: "ماذا لو لم تتناسب طريقة شرح المعلم مع استيعاب ابني؟",
          a: "التعليم رحلة استكشاف! إذا لم تكن الحصة الأولى كما تتوقع، فنظام المنصة يتيح لك حرية مطلقة. المبلغ المدفوع يكون للحصة فقط، ولا يلزمك النظام بالاستمرار مع نفس المعلم. يمكنك قراءة تقييمات الطلاب الآخرين واختيار معلم آخر في الحصة القادمة بضغطة زر.",
          icon: "🔄",
        },
        {
          q: "هل التقييمات المكتوبة على ملف المعلم حقيقية؟",
          a: "نعم 100%. نظام التقييم في 'تاج' مغلق وصارم؛ لا يمكن لأي شخص كتابة تقييم أو وضع نجوم لمعلم إلا إذا كان طالباً قد حجز حصة فعلية معه ودفع ثمنها وأكملها حتى النهاية. هذا يضمن لك شفافية ومصداقية تامة عند اختيار المعلم الأنسب.",
          icon: "⚖️",
        },
      ]
    },
    {
      title: "🎓 أسئلة الشفافية (خاصة بالمعلمين)",
      faqs: [
        {
          q: "كيف يتم احتساب عمولة المنصة وأرباحي كمعلم؟",
          a: "نحن نؤمن بالنجاح المشترك. عمولة منصة 'تاج' هي نسبة مئوية واضحة وثابتة تُخصم من قيمة الحصة مقابل توفير الفصول الافتراضية، والتسويق، وبوابات الدفع، والدعم الفني. الباقي يضاف مباشرة إلى محفظتك كأرباح صافية قابلة للسحب.",
          icon: "💼",
        },
        {
          q: "في حال إطلاق المنصة لكوبونات خصم، هل سأتحمل التكلفة وحدي؟",
          a: "بالتأكيد لا! نحن شركاء. في حال وجود حملات تسويقية وتخفيضات للطلاب، يتم توزيع الخصم بنسبة عادلة ومدروسة بين عمولة المنصة وحصة المعلم. هذا يجلب لك عدداً أكبر من الطلاب الجدد ويضمن لك زيادة في الدخل الإجمالي.",
          icon: "🤝",
        },
        {
          q: "متى وكيف يمكنني سحب أرباحي من المحفظة؟",
          a: "بمجرد انتهاء الحصة، يتم إيداع الأرباح في محفظتك الافتراضية. يمكنك طلب 'سحب الأرباح' (Payout) برمجياً عبر لوحة التحكم الخاصة بك في أي وقت، وسيتم تحويل المبلغ إلى حسابك البنكي الموثق لدينا خلال دورة التحويلات المعتمدة في المنصة.",
          icon: "🏦",
        },
      ]
    }
  ];

  // استخدام معرّف نصي (String ID) لتتبع الأكورديون المفتوح (مثال: "cat1-faq2")
  const [openId, setOpenId] = useState<string | null>("cat0-faq0");

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 text-slate-900 p-4 md:p-8 selection:bg-blue-500 selection:text-white" dir="rtl">
      {/* 🎭 الخلفية التفاعلية المضيئة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[5%] -left-20 w-[500px] h-[500px] rounded-full bg-blue-300/40 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[10%] -right-20 w-[600px] h-[600px] rounded-full bg-indigo-300/30 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-12 py-10 md:py-16">
        
        {/* ✨ قسم العنوان */}
        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-bold tracking-wide text-blue-700 shadow-sm">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>
            <span>مركز الدعم والمساعدة</span>
          </div>
          {/* تم تصغير الخط هنا */}
          <h3 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 drop-shadow-sm">
            الأسئلة الشائعة
          </h3>
          {/* تم تصغير الخط هنا */}
          <p className="text-slate-500 text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            كل الإجابات التي تحتاجها لتبدأ رحلتك التعليمية مع منصة <span className="text-blue-600 font-bold">تاج</span> بكل ثقة وأمان.
          </p>
        </div>

        {/* 🧩 قسم الأقسام والأسئلة */}
        <div className="space-y-10 animate-fade-in-up-delay">
          {faqCategories.map((category, catIndex) => (
            <div key={catIndex} className="space-y-4">
              {/* عنوان القسم */}
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 border-b-2 border-blue-100 pb-2 inline-block">
                {category.title}
              </h2>
              
              {/* أسئلة القسم */}
              <div className="space-y-3">
                {category.faqs.map((faq, faqIndex) => {
                  const currentId = `cat${catIndex}-faq${faqIndex}`;
                  const isOpen = openId === currentId;
                  
                  return (
                    <div
                      key={faqIndex}
                      className={`group border transition-all duration-500 overflow-hidden rounded-2xl ${
                        isOpen 
                          ? "bg-white shadow-md border-blue-200" 
                          : "bg-white/70 hover:bg-white border-slate-200/80 backdrop-blur-sm hover:shadow-sm"
                      }`}
                    >
                      <button
                        onClick={() => setOpenId(isOpen ? null : currentId)}
                        className="w-full text-right p-5 flex items-center justify-between gap-4 outline-none"
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`text-2xl transition-transform duration-500 ${isOpen ? "scale-110 rotate-6" : "opacity-80 group-hover:scale-110"}`}>
                            {faq.icon}
                          </span>
                          {/* تم تصغير خط السؤال */}
                          <h3 className={`text-base md:text-lg font-bold transition-colors duration-300 ${isOpen ? "text-blue-700" : "text-slate-700 group-hover:text-blue-600"}`}>
                            {faq.q}
                          </h3>
                        </div>
                        <div className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isOpen ? "bg-blue-600 border-blue-600 text-white rotate-45 shadow-md" : "text-slate-400 border-slate-200 group-hover:border-blue-300 group-hover:text-blue-500"}`}>
                          <span className="text-xl font-light leading-none">+</span>
                        </div>
                      </button>
                      
                      <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 pb-5 px-5 md:px-16" : "grid-rows-[0fr] opacity-0"}`}>
                        <div className="overflow-hidden">
                          <div className="pt-3 border-t border-slate-100">
                            {/* تم تصغير خط الإجابة */}
                            <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed max-w-3xl">
                              {faq.a}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 🚀 قسم الإجراء النهائي (Footer CTA) */}
        <div className="pt-8 animate-fade-in-up-delay-2">
          <div className="relative group bg-gradient-to-br from-white to-slate-50 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-lg text-center space-y-6 overflow-hidden transition-all duration-500">
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-blue-400/10 blur-[60px] group-hover:translate-x-1/3 group-hover:translate-y-1/3 transition-all duration-1000 ease-out"></div>
            
            <div className="relative z-10 space-y-3">
              <h3  className="text-2xl md:text-3xl font-black text-slate-900">لم تجد إجابة لسؤالك؟</h3>
              <p className="text-slate-500 text-base font-medium">فريق الدعم الفني متواجد دائماً للإجابة على استفساراتك وتقديم المساعدة.</p>
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-3 pt-3">
              <Link
                href={user ? "/dashboard/support" : "/login"}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>تواصل مع الدعم الفني</span>
                <span className="text-lg">🎧</span>
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>العودة للرئيسية</span>
                <span className="text-lg">🏠</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-fade-in-up-delay { animation: fade-in-up 0.6s ease-out 0.1s forwards; opacity: 0; }
        .animate-fade-in-up-delay-2 { animation: fade-in-up 0.6s ease-out 0.2s forwards; opacity: 0; }
      `}</style>
    </div>
  );
}