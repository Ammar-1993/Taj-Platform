"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import DecorativeBackground from "@/components/layout/DecorativeBackground";
import BrandEmblem from "@/components/ui/BrandEmblem";
import {
  Headphones,
  Home,
  Plus,
  HelpCircle,
  Rocket,
  Target,
  Laptop,
  CircleDollarSign,
  Lock,
  Wifi,
  Ticket,
  CreditCard,
  Users,
  BarChart3,
  UserPlus,
  Star,
  RefreshCw,
  Scale,
  GraduationCap,
  Briefcase,
  Handshake,
  Landmark,
  Search,
  X,
  Sparkles,
  ShieldCheck,
  Clock,
} from "lucide-react";

export default function FAQPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>("cat0-faq0");

  const faqCategories = useMemo(
    () => [
      {
        id: "start",
        title: "البداية والاستخدام",
        icon: <Rocket className="w-5 h-5 text-indigo-600" />,
        badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
        faqs: [
          {
            q: "كيف أبدأ بحجز حصتي الأولى؟",
            a: "ببساطة اختر مادة من الصفحة الرئيسية، تصفح قائمة المعلمين المتاحين، اختر المعلم المناسب، ثم حدد موعداً من جدوله وأكمل عملية الحجز بكل سهولة.",
            icon: <Target className="w-5 h-5 text-indigo-500" />,
          },
          {
            q: "ما هي المتطلبات التقنية لحضور الفصل الافتراضي؟",
            a: "لا حاجة لتحميل أي برامج معقدة! كل ما تحتاجه هو جهاز حاسوب أو حاسوب محمول أو جهاز لوحي متصل بإنترنت مستقر، ومتصفح حديث (مثل Google Chrome أو Safari).",
            icon: <Laptop className="w-5 h-5 text-blue-500" />,
          },
        ],
      },
      {
        id: "security",
        title: "الأمان المالي وضمان الحقوق",
        icon: <CircleDollarSign className="w-5 h-5 text-emerald-600" />,
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
        faqs: [
          {
            q: "كيف أضمن حقي المالي بعد شحن المحفظة وحجز الحصة؟",
            a: "في منصة 'تاج'، نستخدم نظام 'التجميد الآمن' (Escrow). عند حجزك لحصة، لا يتم تحويل المبلغ للمعلم مباشرة، بل يبقى مجمداً وآمناً في نظام المنصة. لا يتم تحويل الرصيد إلى محفظة المعلم إلا بعد انتهاء الحصة الافتراضية بنجاح وتأكيد الحضور. أموالك دائماً في أمان تام!",
            icon: <Lock className="w-5 h-5 text-emerald-500" />,
          },
          {
            q: "ماذا يحدث إذا انقطع الإنترنت لدي أو لدى المعلم أثناء الحصة؟",
            a: "نحن نتفهم المشاكل التقنية الخارجة عن الإرادة. إذا كان الانقطاع من طرف المعلم ولم تكتمل الحصة، يتم إعادة المبلغ إلى محفظتك فوراً لجدولة حصة أخرى. أما إذا كان الانقطاع من طرف الطالب، فيمكن التواصل مع المعلم عبر المنصة لتعويض الوقت المتبقي بالتراضي، فمعلمونا شركاء في نجاح أبنائكم.",
            icon: <Wifi className="w-5 h-5 text-sky-500" />,
          },
          {
            q: "كيف تعمل أكواد الخصم؟ وهل تؤثر على جودة الحصة؟",
            a: "إطلاقاً! جودة التعليم خط أحمر. عندما نطلق أكواد خصم ترويجية للطلاب، يتم تقاسم تكلفة هذا الخصم بين أرباح المنصة وحصة المعلم بناءً على اتفاقية مسبقة وعادلة بنسبة مئوية. المعلم يحصل على كامل مستحقاته، والطالب يستمتع بتعليم استثنائي بسعر مخفض!",
            icon: <Ticket className="w-5 h-5 text-amber-500" />,
          },
          {
            q: "ما هي وسائل الدفع المتاحة لشحن المحفظة؟",
            a: "نوفر خيارات دفع آمنة ومتعددة تشمل: البطاقات الائتمانية (فيزا، ماستركارد)، مدى (Mada)، أبل باي (Apple Pay)، بالإضافة إلى سداد والتحويلات البنكية المعتمدة.",
            icon: <CreditCard className="w-5 h-5 text-purple-500" />,
          },
        ],
      },
      {
        id: "parents",
        title: "متابعة ولي الأمر وتعدد الأبناء",
        icon: <Users className="w-5 h-5 text-purple-600" />,
        badgeColor: "bg-purple-50 text-purple-700 border-purple-100",
        faqs: [
          {
            q: "كيف يمكنني متابعة أداء ابني ومستواه مع المعلمين؟",
            a: "لقد صممنا لوحة تحكم خاصة بـ 'ولي الأمر'. يمكنك من خلالها متابعة سجل حضور وغياب ابنك، والاطلاع على التقييمات والملاحظات التي يكتبها المعلمون بعد كل حصة، بالإضافة إلى تتبع رصيد المحفظة والمدفوعات بكل شفافية.",
            icon: <BarChart3 className="w-5 h-5 text-purple-500" />,
          },
          {
            q: "لدي أكثر من ابن في مراحل دراسية مختلفة، هل أحتاج لحسابات متعددة؟",
            a: "راحتكم تهمنا! لا تحتاج سوى لحساب 'ولي أمر' واحد ومحفظة مالية واحدة. يمكنك إضافة جميع أبنائك كـ 'ملفات شخصية' (Profiles) فرعية تحت حسابك، واستخدام نفس المحفظة لحجز حصص مختلفة لكل ابن على حدة بكل سهولة.",
            icon: <UserPlus className="w-5 h-5 text-pink-500" />,
          },
        ],
      },
      {
        id: "quality",
        title: "جودة التعليم وتقييم الأداء",
        icon: <Star className="w-5 h-5 text-amber-500" />,
        badgeColor: "bg-amber-50 text-amber-700 border-amber-100",
        faqs: [
          {
            q: "ماذا لو لم تتناسب طريقة شرح المعلم مع استيعاب ابني؟",
            a: "التعليم رحلة استكشاف! إذا لم تكن الحصة الأولى كما تتوقع، فنظام المنصة يتيح لك حرية مطلقة. المبلغ المدفوع يكون للحصة فقط، ولا يلزمك النظام بالاستمرار مع نفس المعلم. يمكنك قراءة تقييمات الطلاب الآخرين واختيار معلم آخر في الحصة القادمة بضغطة زر.",
            icon: <RefreshCw className="w-5 h-5 text-amber-500" />,
          },
          {
            q: "هل التقييمات المكتوبة على ملف المعلم حقيقية؟",
            a: "نعم 100%. نظام التقييم في 'تاج' مغلق وصارم؛ لا يمكن لأي شخص كتابة تقييم أو وضع نجوم لمعلم إلا إذا كان طالباً قد حجز حصة فعلية معه ودفع ثمنها وأكملها حتى النهاية. هذا يضمن لك شفافية ومصداقية تامة عند اختيار المعلم الأنسب.",
            icon: <Scale className="w-5 h-5 text-emerald-500" />,
          },
        ],
      },
      {
        id: "teachers",
        title: "أسئلة الشفافية (خاصة بالمعلمين)",
        icon: <GraduationCap className="w-5 h-5 text-blue-600" />,
        badgeColor: "bg-blue-50 text-blue-700 border-blue-100",
        faqs: [
          {
            q: "كيف يتم احتساب عمولة المنصة وأرباحي كمعلم؟",
            a: "نحن نؤمن بالنجاح المشترك. عمولة منصة 'تاج' هي نسبة مئوية واضحة وثابتة تُخصم من قيمة الحصة مقابل توفير الفصول الافتراضية، والتسويق، وبوابات الدفع، والدعم الفني. الباقي (80%) يضاف مباشرة إلى محفظتك كأرباح صافية قابلة للسحب.",
            icon: <Briefcase className="w-5 h-5 text-blue-500" />,
          },
          {
            q: "في حال إطلاق المنصة لكوبونات خصم، هل سأتحمل التكلفة وحدي؟",
            a: "بالتأكيد لا! نحن شركاء. في حال وجود حملات تسويقية وتخفيضات للطلاب، يتم توزيع الخصم بنسبة عادلة ومدروسة بين عمولة المنصة وحصة المعلم. هذا يجلب لك عدداً أكبر من الطلاب الجدد ويضمن لك زيادة في الدخل الإجمالي.",
            icon: <Handshake className="w-5 h-5 text-teal-500" />,
          },
          {
            q: "متى وكيف يمكنني سحب أرباحي من المحفظة؟",
            a: "بمجرد اكتمال الحصة بنجاح، يتم إيداع الأرباح في محفظتك الافتراضية فوراً. يمكنك طلب 'سحب الأرباح' (Payout) برمجياً عبر لوحة التحكم الخاصة بك في أي وقت، وسيتم تحويل المبلغ مباشرة إلى حسابك البنكي المعتمد.",
            icon: <Landmark className="w-5 h-5 text-indigo-500" />,
          },
        ],
      },
    ],
    []
  );

  // تصفية الأسئلة بناءً على نص البحث والقسم المختار
  const filteredCategories = useMemo(() => {
    return faqCategories
      .filter((cat) => (activeCategory === "all" ? true : cat.id === activeCategory))
      .map((cat) => {
        if (!searchQuery.trim()) return cat;
        const normalizedQuery = searchQuery.trim().toLowerCase();
        const filteredFaqs = cat.faqs.filter(
          (faq) =>
            faq.q.toLowerCase().includes(normalizedQuery) ||
            faq.a.toLowerCase().includes(normalizedQuery)
        );
        return { ...cat, faqs: filteredFaqs };
      })
      .filter((cat) => cat.faqs.length > 0);
  }, [faqCategories, activeCategory, searchQuery]);

  const totalResults = filteredCategories.reduce((acc, cat) => acc + cat.faqs.length, 0);

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50/80 text-slate-900 p-4 sm:p-6 lg:p-8" dir="rtl">
      
      {/* 🎭 الخلفية التفاعلية المضيئة وشبكة الماتريكس */}
      <DecorativeBackground />

      <div className="relative z-10 max-w-4xl mx-auto space-y-8 py-8 md:py-12">
        
        {/* ✨ قسم الترويسة والشعار الملكي الفاخر */}
        <div className="text-center space-y-4 animate-fade-in-up flex flex-col items-center">
          <BrandEmblem size="lg" className="mb-2" />
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-50/90 text-indigo-700 border border-indigo-100 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>مركز الدعم والمساعدة</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            الأسئلة الشائعة
          </h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed">
            كل الإجابات التي تحتاجها لتبدأ رحلتك التعليمية مع منصة{" "}
            <span className="text-indigo-600 font-bold">تاج</span> بكل ثقة وأمان.
          </p>
        </div>

        {/* 🔍 شريط البحث الذكي الحي (Live Search Bar) */}
        <div className="relative max-w-2xl mx-auto animate-fade-in-up">
          <div className="relative group">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الأسئلة الشائعة (مثال: محفظة، حجز حصة، عمولة المعلم)..."
              className="w-full pr-12 pl-12 py-3.5 text-sm sm:text-base bg-white/90 backdrop-blur-xl border border-white/90 rounded-2xl shadow-lg shadow-indigo-500/5 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-400 transition-all font-medium placeholder:text-slate-400"
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 hover:text-slate-600"
                title="مسح البحث"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 🏷️ أشرطة تبويب التصنيفات السريعة (Category Filter Pills) */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 ${
              activeCategory === "all"
                ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25 scale-105"
                : "bg-white/80 backdrop-blur-md text-slate-600 hover:bg-white hover:text-indigo-600 border border-slate-200/60"
            }`}
          >
            جميع الأسئلة
          </button>

          {faqCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25 scale-105"
                  : "bg-white/80 backdrop-blur-md text-slate-600 hover:bg-white hover:text-indigo-600 border border-slate-200/60"
              }`}
            >
              <span>{cat.title}</span>
            </button>
          ))}
        </div>

        {/* 🧩 قسم الأقسام والأسئلة (FAQ Accordion Cards) */}
        <div className="space-y-8 animate-fade-in-up-delay">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category, catIndex) => (
              <div key={category.id || catIndex} className="space-y-4">
                
                {/* ترويسة القسم الفاخرة */}
                <div className="flex items-center justify-between border-b border-indigo-100/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                      {category.icon}
                    </div>
                    <h2 className="text-lg md:text-xl font-black text-slate-900">
                      {category.title}
                    </h2>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${category.badgeColor}`}>
                    {category.faqs.length} {category.faqs.length === 1 ? "سؤال" : "أسئلة"}
                  </span>
                </div>
                
                {/* بطاقات الأسئلة الزجاجية التفاعلية */}
                <div className="space-y-3.5">
                  {category.faqs.map((faq, faqIndex) => {
                    const currentId = `cat${catIndex}-faq${faqIndex}`;
                    const isOpen = openId === currentId;
                    
                    return (
                      <div
                        key={faqIndex}
                        className={`group border transition-all duration-300 overflow-hidden rounded-2xl ${
                          isOpen
                            ? "bg-white/95 backdrop-blur-2xl shadow-xl shadow-indigo-500/10 border-indigo-200 ring-2 ring-indigo-500/10"
                            : "bg-white/80 hover:bg-white backdrop-blur-md border-white/90 hover:border-indigo-100 shadow-sm hover:shadow-md"
                        }`}
                      >
                        <button
                          onClick={() => setOpenId(isOpen ? null : currentId)}
                          className="w-full text-right p-4 sm:p-5 flex items-center justify-between gap-4 outline-none select-none cursor-pointer"
                          aria-expanded={isOpen}
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 ${
                                isOpen
                                  ? "bg-indigo-50 text-indigo-600 scale-110"
                                  : "bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                              }`}
                            >
                              {faq.icon}
                            </div>
                            <h3
                              className={`text-sm sm:text-base font-bold transition-colors duration-200 ${
                                isOpen ? "text-indigo-700" : "text-slate-800 group-hover:text-indigo-600"
                              }`}
                            >
                              {faq.q}
                            </h3>
                          </div>

                          <div
                            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isOpen
                                ? "bg-indigo-600 text-white rotate-45 shadow-md shadow-indigo-500/30"
                                : "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                            }`}
                          >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        </button>
                        
                        <div
                          className={`grid transition-all duration-300 ease-in-out ${
                            isOpen ? "grid-rows-[1fr] opacity-100 pb-5 px-5 sm:px-16" : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="pt-3 border-t border-slate-100 bg-slate-50/50 p-4 rounded-xl text-right">
                              <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
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
            ))
          ) : (
            // حالة عدم وجود نتائج بحث (Empty State)
            <div className="text-center py-12 px-4 bg-white/70 backdrop-blur-xl rounded-3xl border border-white shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">لا توجد نتائج تطابق بحثك</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                لم نجد أي سؤال يطابق عبارة &quot;{searchQuery}&quot;، يمكنك تجربة كلمة بحث أخرى أو التواصل معنا.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-4"
              >
                عرض كافة الأسئلة
              </button>
            </div>
          )}
        </div>

        {/* 🚀 قسم الدعم والمساعدة النهائي (Luxury Support CTA Card) */}
        <div className="pt-6 animate-fade-in-up-delay-2">
          <div className="relative group bg-white/85 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-white/90 shadow-2xl shadow-indigo-500/10 text-center space-y-6 overflow-hidden ring-1 ring-slate-900/5">
            {/* خط التدرج العلوي */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-blue-600 to-purple-600" />
            
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-blue-600 text-white rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
                <Headphones className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">لم تجد إجابة لسؤالك؟</h3>
              <p className="text-slate-500 text-sm font-medium max-w-md">
                فريق الدعم الفني متواجد دائماً للإجابة على استفساراتك وتقديم المساعدة في أي وقت.
              </p>
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-3.5 pt-2">
              <Link
                href={user ? "/dashboard/support" : "/login"}
                className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 text-sm"
              >
                <Headphones className="w-4 h-4" />
                <span>تواصل مع الدعم الفني</span>
              </Link>
              <Link
                href="/"
                className="px-6 py-3.5 bg-white/90 border border-slate-200 text-slate-700 font-bold rounded-xl hover:border-indigo-200 hover:text-indigo-600 hover:bg-white hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 text-sm shadow-sm"
              >
                <Home className="w-4 h-4" />
                <span>العودة للرئيسية</span>
              </Link>
            </div>

            {/* شارة الثقة والسرعة */}
            <div className="pt-2 flex items-center justify-center gap-4 text-xs text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                متوسط الرد أقل من 5 دقائق
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                دعم متواصل 24/7
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}