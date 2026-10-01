import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Wallet } from "@/types";
import { formatDate } from "@/lib/formatters";
import { 
  WalletCards, Banknote, Zap, BarChart2,
  Landmark, LifeBuoy, ArrowUpLeft, ArrowDownRight, ArrowLeft
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";

interface WalletWidgetProps {
  wallet: Wallet | null;
  isTeacher: boolean;
}

export const WalletWidget: React.FC<WalletWidgetProps> = ({ wallet, isTeacher }) => {
  const { isCollapsed } = useSidebar();
  const transactions = wallet?.transactions?.data || [];

  /**
   * Translates technical descriptions into clear, friendly Arabic.
   */
  const getFriendlyDescription = (desc: string, isNegative: boolean) => {
    if (!desc) return isNegative ? "خصم مالي" : "إيداع مالي";
    const lower = desc.toLowerCase();
    
    if (lower.includes("top-up") || lower.includes("deposit") || desc.includes("شحن")) {
      return "شحن المحفظة الإلكترونية";
    }
    if (lower.includes("payout") || lower.includes("withdrawal") || desc.includes("سحب")) {
      return "سحب أرباح المحفظة";
    }
    if (lower.includes("earning") || desc.includes("أرباح") || desc.includes("تحصيل")) {
      return "أرباح إكمال حصة تعليمية";
    }
    if (lower.includes("booking") || lower.includes("deduction") || desc.includes("خصم")) {
      return "خصم لحجز حصة تعليمية";
    }
    if (lower.includes("refund") || desc.includes("استرجاع") || desc.includes("استرداد")) {
      return "استرداد مبلغ الحجز";
    }
    return desc.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "").replace(/:\s*$/, "").trim() || (isNegative ? "خصم حجز / سحب" : "إيداع / أرباح");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 lg:space-y-6 lg:gap-0 lg:sticky lg:top-24">
      {/* 💰 Wallet Card — Ultra-Premium Glassmorphism */}
      <div className="animate-fade-up-1 group relative overflow-hidden rounded-[2rem] border border-white/80 dark:border-white/20 bg-white/40 backdrop-blur-2xl shadow-[0_20px_50px_rgba(79,70,229,0.12)] transition-all duration-500 hover:shadow-[0_30px_60px_rgba(79,70,229,0.22)] hover:-translate-y-1">
        {/* Background Blobs for Ambient Glass Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-white/30 -z-10 pointer-events-none"></div>
        <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-brand-400 opacity-20 blur-[75px] group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-purple-400 opacity-20 blur-[65px] group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>

        {/* Moving Reflection Glint */}
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/35 to-transparent -z-5 skew-x-12 pointer-events-none"></div>

        <div className={cn(
          "relative z-10 transition-all duration-300",
          isCollapsed ? "p-6 sm:p-7 xl:p-8" : "p-5 sm:p-5 xl:p-6"
        )}>
          {/* Card Header */}
          <div className="flex items-center justify-between gap-2.5 mb-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/90 border border-indigo-100/80 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <WalletCards className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-800 text-xs sm:text-sm font-black tracking-tight truncate">
                  رصيد المحفظة
                </h3>
                <span className="text-[10px] text-slate-400 font-bold block truncate">
                  {isTeacher ? "محفظة أرباح المعلم" : "المحفظة الإلكترونية للطالب"}
                </span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-1 rounded-full shadow-2xs shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              نشطة
            </span>
          </div>

          {/* Primary Balance */}
          <div className="mt-5">
            <CurrencyDisplay 
              amount={wallet?.balance || 0} 
              size="xl" 
              className={cn(
                "!justify-start text-slate-900 font-black tracking-tight",
                isCollapsed ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl xl:text-4xl"
              )}
            />
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {isTeacher ? "الرصيد المتاح لطلب السحب الفوري" : "الرصيد المتاح لحجز الحصص الجديدة"}
            </p>
          </div>

          {/* Action Button */}
          <div className="mt-5 sm:mt-6">
            {isTeacher ? (
              <Button asChild className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_12px_24px_rgba(79,70,229,0.32)] hover:shadow-[0_16px_32px_rgba(79,70,229,0.42)] rounded-2xl py-5 sm:py-6 font-black transition-all duration-300 active:scale-[0.98] group/btn overflow-hidden relative">
                <Link href="/dashboard/payout" className="flex items-center justify-center gap-2 text-sm sm:text-base">
                  <span>طلب سحب الأرباح</span>
                  <Banknote className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_12px_24px_rgba(79,70,229,0.32)] hover:shadow-[0_16px_32px_rgba(79,70,229,0.42)] rounded-2xl py-5 sm:py-6 font-black transition-all duration-300 active:scale-[0.98] group/btn overflow-hidden relative">
                <Link href="/dashboard/top-up" className="flex items-center justify-center gap-2 text-sm sm:text-base">
                  <span>شحن المحفظة</span>
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-pulse group-hover/btn:rotate-12 transition-transform duration-300" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Second Column on Tablet / Stacked below Wallet on Desktop */}
      <div className="space-y-6 flex flex-col justify-between">
        {/* 📊 Recent Transactions — Refined Glass */}
        <Card className={cn(
          "animate-fade-up-2 bg-white/40 backdrop-blur-xl border border-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[2rem] hover:shadow-[0_15px_35px_rgba(0,0,0,0.05)] transition-all duration-500",
          isCollapsed ? "p-6" : "p-5"
        )}>
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h3 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2.5">
              <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-2xs">
                <BarChart2 className="w-4 h-4" />
              </span>
              آخر العمليات المالية
            </h3>
            <Link 
              href="/dashboard/financial-record" 
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors group/link"
            >
              <span>عرض الكل</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover/link:-translate-x-1 transition-transform" />
            </Link>
          </div>

          {transactions.length === 0 ? (
            <EmptyState icon={Landmark} title="لا توجد عمليات سابقة" className="py-7 bg-slate-50/40 rounded-2xl border-dashed border-slate-200/80 text-xs" />
          ) : (
            <ul className="space-y-2">
              {transactions.slice(0, 3).map((tx) => {
                const isNegative = tx.type === "withdrawal" || parseFloat(String(tx.amount)) < 0;
                const absAmount = Math.abs(parseFloat(tx.amount)).toFixed(2);

                return (
                  <Link key={tx.id} href="/dashboard/financial-record" className="block">
                    <li className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-white/40 hover:bg-white/90 border border-white/60 hover:border-indigo-100 shadow-2xs cursor-pointer transition-all duration-300 group/item hover:-translate-x-0.5">
                      {/* Status Icon */}
                      <div className={cn(
                        "shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-transform group-hover/item:scale-110",
                        isNegative ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      )}>
                        {isNegative ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpLeft className="w-4 h-4" />
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 truncate group-hover/item:text-indigo-600 transition-colors">
                          {getFriendlyDescription(tx.description, isNegative)}
                        </p>
                        <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-0.5">
                          {formatDate(tx.created_at, "medium")}
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="shrink-0 flex items-center justify-end gap-1 font-black text-xs sm:text-sm" dir="ltr">
                        <span className={cn("text-[10px] font-bold opacity-80", isNegative ? "text-rose-600" : "text-emerald-600")}>
                          ر.س
                        </span>
                        <span className={isNegative ? "text-rose-600" : "text-emerald-600"}>
                          {isNegative ? `-${absAmount}` : `+${absAmount}`}
                        </span>
                      </div>
                    </li>
                  </Link>
                );
              })}
            </ul>
          )}
        </Card>

        {/* 🛟 Help Center Card — Royal Luxury */}
        <Card className={cn(
          "animate-fade-up-3 bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-white/80 backdrop-blur-xl border border-blue-100/70 shadow-[0_10px_30px_rgba(59,130,246,0.05)] rounded-[2rem] relative overflow-hidden group hover:shadow-[0_15px_35px_rgba(59,130,246,0.1)] transition-all duration-500",
          isCollapsed ? "p-6" : "p-5"
        )}>
          <div className="absolute -right-8 -bottom-8 text-blue-200/40 opacity-30 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000 ease-out pointer-events-none">
            <LifeBuoy size={140} strokeWidth={1} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-200 group-hover:rotate-[360deg] transition-transform duration-1000">
                <LifeBuoy className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-none">مركز المساعدة</h3>
                <span className="text-[9px] text-blue-600 font-black uppercase tracking-widest">Support Hub</span>
              </div>
            </div>
            
            <p className="text-[11px] sm:text-xs text-slate-500 mb-4 sm:mb-5 leading-relaxed font-bold">
              هل تواجه مشكلة؟ فريق الدعم متاح لمساعدتك في أي وقت لحل جميع استفساراتك.
            </p>
            
            <Button asChild className="w-full bg-white hover:bg-blue-600 text-blue-600 hover:text-white border-2 border-blue-100 shadow-sm rounded-2xl font-black py-5 sm:py-6 transition-all duration-300 active:scale-95 group/btn overflow-hidden relative">
              <Link href="/dashboard/support" className="flex items-center justify-center gap-2">
                <span className="relative z-10 text-xs sm:text-sm">فتح تذكرة دعم فني</span>
                <span className="w-2 h-2 rounded-full bg-blue-500 group-hover/btn:bg-white animate-pulse"></span>
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
