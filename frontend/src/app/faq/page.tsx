"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Headphones, Home, Plus, HelpCircle, Rocket, Target, Laptop, CircleDollarSign, Lock, Wifi, Ticket, CreditCard, Users, BarChart3, UserPlus, Star, RefreshCw, Scale, GraduationCap, Briefcase, Handshake, Landmark } from "lucide-react";

export default function FAQPage() {
  const { user } = useAuth();

  const faqCategories = [
    {
      title: "البداية والاستخدام",
      icon: <Rocket className="w-5 h-5 text-indigo-500" />,
      faqs: [
        {
          q: "كيف أبدأ بحجز حصتي الأولى؟",
          a: "ببساطة اختر مادة من الصفحة الرئيسية، تصفح قائمة المعلمين المتاحين، اختر المعلم المناسب، ثم حدد موعداً من جدوله وأكمل عملية الحجز.",
          icon: <Target className="w-5 h-5" />,
        },
        {
          q: "ما هي المتطلبات التقنية لحضور الفصل الافتراضي؟",
          a: "لا حاجة لتحميل أي برامج معقدة! كل ما تحتاجه هو جهاز حاسوب أو حاسوب محمول أو جهاز لوحي متصل بإنترنت مستقر، ومتصفح حديث (مثل Google Chrome أو Safari).",
          icon: <Laptop className="w-5 h-5" />,
        },
      ]
    },
    {
      title: "الأمان المالي وضمان الحقوق",
      icon: <CircleDollarSign className="w-5 h-5 text-indigo-500" />,
      faqs: [
        {
          q: "كيف أضمن حقي المالي بعد شحن المحفظة وحجز الحصة؟",
          a: "في منصة 'تاج'، نستخدم نظام 'التجميد الآمن' (Escrow). عند حجزك لحصة، لا يتم تحويل المبلغ للمعلم مباشرة، بل يبقى مجمداً وآمناً في نظام المنصة. لا يتم تحويل الرصيد إلى محفظة المعلم إلا بعد انتهاء الحصة الافتراضية بنجاح وتأكيد الحضور. أموالك دائماً في أمان!",
          icon: <Lock className="w-5 h-5" />,
        },
        {
          q: "ماذا يحدث إذا انقطع الإنترنت لدي أو لدى المعلم أثناء الحصة؟",
          a: "نحن نتفهم المشاكل التقنية الخارجة عن الإرادة. إذا كان الانقطاع من طرف المعلم ولم تكتمل الحصة، يتم إعادة المبلغ إلى محفظتك فوراً لجدولة حصة أخرى. أما إذا كان الانقطاع من طرف الطالب، فيمكن التواصل مع المعلم عبر المنصة لتعويض الوقت المتبقي بالتراضي، فمعلمونا شركاء في نجاح أبنائكم.",
          icon: <Wifi className="w-5 h-5" />,
        },
        {
          q: "كيف تعمل أكواد الخصم؟ وهل تؤثر على جودة الحصة؟",
          a: "إطلاقاً! جودة التعليم خط أحمر. عندما نطلق أكواد خصم ترويجية للطلاب، يتم تقاسم تكلفة هذا الخصم بين أرباح المنصة وجزء بسيط من أرباح المعلم بناءً على اتفاقية مسبقة وعادلة بنسبة مئوية (مثلاً: تتحمل المنصة الجزء الأكبر من التخفيض لدعم المعلم). المعلم يحصل على حقه، والطالب يحصل على تعليم ممتاز بسعر أقل!",
          icon: <Ticket className="w-5 h-5" />,
        },
        {
          q: "ما هي وسائل الدفع المتاحة لشحن المحفظة؟",
          a: "نحن نوفر خيارات دفع آمنة ومتعددة تشمل: البطاقات الائتمانية (فيزا، ماستركارد)، مدى (Mada)، أبل باي (Apple Pay)، بالإضافة إلى التحويل البنكي المباشر لضمان راحتك.",
          icon: <CreditCard className="w-5 h-5" />,
        },
      ]
    },
    {
      title: "متابعة ولي الأمر وتعدد الأبناء",
      icon: <Users className="w-5 h-5 text-indigo-500" />,
      faqs: [
        {
          q: "كيف يمكنني متابعة أداء ابني ومستواه مع المعلمين؟",
          a: "لقد صممنا لوحة تحكم خاصة بـ 'ولي الأمر'. يمكنك من خلالها متابعة سجل حضور وغياب ابنك، والاطلاع على التقييمات والملاحظات التي يكتبها المعلمون بعد كل حصة، بالإضافة إلى تتبع رصيد المحفظة والمدفوعات بكل شفافية.",
          icon: <BarChart3 className="w-5 h-5" />,
        },
        {
          q: "لدي أكثر من ابن في مراحل دراسية مختلفة، هل أحتاج لحسابات متعددة؟",
          a: "راحتكم تهمنا! لا تحتاج سوى لحساب 'ولي أمر' واحد ومحفظة مالية واحدة. يمكنك إضافة جميع أبنائك كـ 'ملفات شخصية' (Profiles) فرعية تحت حسابك، واستخدام نفس المحفظة لحجز حصص مختلفة لكل ابن على حدة بكل سهولة.",
          icon: <UserPlus className="w-5 h-5" />,
        },
      ]
    },
    {
      title: "جودة التعليم وتقييم الأداء",
      icon: <Star className="w-5 h-5 text-indigo-500" />,
      faqs: [
        {
          q: "ماذا لو لم تتناسب طريقة شرح المعلم مع استيعاب ابني؟",
          a: "التعليم رحلة استكشاف! إذا لم تكن الحصة الأولى كما تتوقع، فنظام المنصة يتيح لك حرية مطلقة. المبلغ المدفوع يكون للحصة فقط، ولا يلزمك النظام بالاستمرار مع نفس المعلم. يمكنك قراءة تقييمات الطلاب الآخرين واختيار معلم آخر في الحصة القادمة بضغطة زر.",
          icon: <RefreshCw className="w-5 h-5" />,
        },
        {
          q: "هل التقييمات المكتوبة على ملف المعلم حقيقية؟",
          a: "نعم 100%. نظام التقييم في 'تاج' مغلق وصارم؛ لا يمكن لأي شخص كتابة تقييم أو وضع نجوم لمعلم إلا إذا كان طالباً قد حجز حصة فعلية معه ودفع ثمنها وأكملها حتى النهاية. هذا يضمن لك شفافية ومصداقية تامة عند اختيار المعلم الأنسب.",
          icon: <Scale className="w-5 h-5" />,
        },
      ]
    },
    {
      title: "أسئلة الشفافية (خاصة بالمعلمين)",
      icon: <GraduationCap className="w-5 h-5 text-indigo-500" />,
      faqs: [
        {
          q: "كيف يتم احتساب عمولة المنصة وأرباحي كمعلم؟",
          a: "نحن نؤمن بالنجاح المشترك. عمولة منصة 'تاج' هي نسبة مئوية واضحة وثابتة تُخصم من قيمة الحصة مقابل توفير الفصول الافتراضية، والتسويق، وبوابات الدفع، والدعم الفني. الباقي يضاف مباشرة إلى محفظتك كأرباح صافية قابلة للسحب.",
          icon: <Briefcase className="w-5 h-5" />,
        },
        {
          q: "في حال إطلاق المنصة لكوبونات خصم، هل سأتحمل التكلفة وحدي؟",
          a: "بالتأكيد لا! نحن شركاء. في حال وجود حملات تسويقية وتخفيضات للطلاب، يتم توزيع الخصم بنسبة عادلة ومدروسة بين عمولة المنصة وحصة المعلم. هذا يجلب لك عدداً أكبر من الطلاب الجدد ويضمن لك زيادة في الدخل الإجمالي.",
          icon: <Handshake className="w-5 h-5" />,
        },
        {
          q: "متى وكيف يمكنني سحب أرباحي من المحفظة؟",
          a: "بمجرد انتهاء الحصة، يتم إيداع الأرباح في محفظتك الافتراضية. يمكنك طلب 'سحب الأرباح' (Payout) برمجياً عبر لوحة التحكم الخاصة بك في أي وقت، وسيتم تحويل المبلغ إلى حسابك البنكي الموثق لدينا خلال دورة التحويلات المعتمدة في المنصة.",
          icon: <Landmark className="w-5 h-5" />,
        },
      ]
    }
  ];

  const [openId, setOpenId] = useState<string | null>("cat0-faq0");

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8" dir="rtl">
      
      {/* 🎭 الخلفية التفاعلية المضيئة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 z-0">
        <div className="absolute top-[5%] -left-20 w-[30rem] h-[30rem] rounded-full bg-indigo-300/40 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[10%] -right-20 w-[40rem] h-[40rem] rounded-full bg-blue-300/30 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-10 py-6 md:py-10">
        
        {/* ✨ قسم العنوان (مضغوط ليظهر بالكامل في الشاشة الأولى) */}
        <div className="text-center space-y-4 animate-fade-in-up">
          {/* الشعار قابل للنقر للرئيسية */}
          <Link
            href="/"
            className="inline-block text-5xl md:text-6xl hover:scale-110 transition-transform duration-300 drop-shadow-xl cursor-pointer"
            title="العودة للصفحة الرئيسية"
          >
            👑
          </Link>
          
          <div className="flex justify-center mb-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-bold tracking-wide text-indigo-700 shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
              <span>مركز الدعم والمساعدة</span>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 drop-shadow-sm">
            الأسئلة الشائعة
          </h1>
          <p className="text-slate-500 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed">
            كل الإجابات التي تحتاجها لتبدأ رحلتك التعليمية مع منصة <span className="text-indigo-600 font-bold">تاج</span> بكل ثقة وأمان.
          </p>
        </div>

        {/* 🧩 قسم الأقسام والأسئلة */}
        <div className="space-y-10 animate-fade-in-up-delay">
          {faqCategories.map((category, catIndex) => (
            <div key={catIndex} className="space-y-4">
              
              {/* عنوان القسم */}
              <div className="flex items-center gap-2 border-b-2 border-indigo-100/50 pb-2">
                {category.icon}
                <h2 className="text-lg md:text-xl font-extrabold text-slate-800">
                  {category.title}
                </h2>
              </div>
              
              {/* أسئلة القسم */}
              <div className="space-y-3">
                {category.faqs.map((faq, faqIndex) => {
                  const currentId = `cat${catIndex}-faq${faqIndex}`;
                  const isOpen = openId === currentId;
                  
                  return (
                    <div
                      key={faqIndex}
                      className={`group border transition-all duration-300 overflow-hidden rounded-[1.25rem] ${
                        isOpen 
                          ? "bg-white/95 backdrop-blur-xl shadow-lg border-indigo-200 ring-4 ring-indigo-50" 
                          : "bg-white/60 hover:bg-white/90 border-white backdrop-blur-sm shadow-sm hover:shadow-md"
                      }`}
                    >
                      <button
                        onClick={() => setOpenId(isOpen ? null : currentId)}
                        className="w-full text-right p-4 md:p-5 flex items-center justify-between gap-4 outline-none"
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`drop-shadow-sm text-indigo-500 transition-transform duration-500 ${isOpen ? "scale-110 rotate-6" : "opacity-80 group-hover:scale-110"}`}>
                            {faq.icon}
                          </span>
                          <h3 className={`text-sm md:text-base font-bold transition-colors duration-300 ${isOpen ? "text-indigo-700" : "text-slate-700 group-hover:text-indigo-600"}`}>
                            {faq.q}
                          </h3>
                        </div>
                        <div className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isOpen ? "bg-indigo-600 border-indigo-600 text-white rotate-45 shadow-md" : "bg-slate-50 text-slate-400 border-slate-200 group-hover:border-indigo-300 group-hover:text-indigo-500 group-hover:bg-indigo-50"}`}>
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </div>
                      </button>
                      
                      <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 pb-5 px-5 md:px-16" : "grid-rows-[0fr] opacity-0"}`}>
                        <div className="overflow-hidden">
                          <div className="pt-3 border-t border-slate-100/80">
                            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-3xl">
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
          <div className="relative group bg-white/70 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] border border-white shadow-[0_10px_40px_rgba(8,112,184,0.06)] text-center space-y-6 overflow-hidden transition-all duration-500">
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-indigo-400/10 blur-[60px] group-hover:translate-x-1/3 group-hover:translate-y-1/3 transition-all duration-1000 ease-out"></div>
            
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-2">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900">لم تجد إجابة لسؤالك؟</h3>
              <p className="text-slate-500 text-sm font-medium">فريق الدعم الفني متواجد دائماً للإجابة على استفساراتك وتقديم المساعدة.</p>
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <Link
                href={user ? "/dashboard/support" : "/login"}
                className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2.5 text-sm"
              >
                <Headphones className="w-4 h-4" />
                <span>تواصل مع الدعم الفني</span>
              </Link>
              <Link
                href="/"
                className="px-6 py-3.5 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-xl hover:border-indigo-100 hover:text-indigo-600 hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2.5 text-sm shadow-sm"
              >
                <Home className="w-4 h-4" />
                <span>العودة للرئيسية</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* تنسيقات الحركات (Animations) */}
    
    </div>
  );
}