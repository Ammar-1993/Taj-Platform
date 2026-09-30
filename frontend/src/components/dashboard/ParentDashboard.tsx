import React from "react";
import Link from "next/link";
import { ParentDashboardData, Wallet } from "@/types";
import { formatDate } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  WalletCards, Zap, Calendar, 
  BarChart2, Landmark, LifeBuoy, ArrowUpLeft, ArrowDownRight,
  GraduationCap, ArrowLeft, Users
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { ResponsiveBookingTable } from "./bookings";
import { cn } from "@/lib/utils";

interface ParentDashboardProps {
  parentData: ParentDashboardData | null;
  wallet: Wallet | null;
  parentBookingPage: number;
  parentBookingLastPage: number;
  setParentBookingPage: (page: number) => void;
  loading?: boolean;
}

const childColorPalettes = [
  {
    bg: "from-blue-600 via-indigo-600 to-indigo-700",
    shadow: "shadow-indigo-500/20",
    border: "border-indigo-100",
    badge: "bg-indigo-50 text-indigo-700",
  },
  {
    bg: "from-emerald-500 via-teal-600 to-teal-700",
    shadow: "shadow-emerald-500/20",
    border: "border-emerald-100",
    badge: "bg-emerald-50 text-emerald-700",
  },
  {
    bg: "from-purple-600 via-violet-600 to-fuchsia-700",
    shadow: "shadow-purple-500/20",
    border: "border-purple-100",
    badge: "bg-purple-50 text-purple-700",
  },
  {
    bg: "from-amber-500 via-orange-500 to-amber-600",
    shadow: "shadow-amber-500/20",
    border: "border-amber-100",
    badge: "bg-amber-50 text-amber-700",
  },
  {
    bg: "from-cyan-500 via-sky-600 to-blue-600",
    shadow: "shadow-cyan-500/20",
    border: "border-cyan-100",
    badge: "bg-cyan-50 text-cyan-700",
  },
  {
    bg: "from-rose-500 via-pink-600 to-rose-600",
    shadow: "shadow-rose-500/20",
    border: "border-rose-100",
    badge: "bg-rose-50 text-rose-700",
  },
];

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  parentData,
  wallet,
  parentBookingPage,
  parentBookingLastPage,
  setParentBookingPage,
  loading = false,
}) => {
  // Action handlers for unified table (parents primarily view)
  const handleCancelClick = (id: number) => {
    console.log("Parent requested cancellation info for:", id);
  };

  const handleCompleteClick = (id: number) => {
    console.log("Parent requested completion info for:", id);
  };

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Sidebar: Wallet Skeleton */}
        <div className="w-full lg:w-[340px] xl:w-[380px] 2xl:w-[410px] lg:shrink-0 space-y-6">
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="animate-pulse bg-white/60 backdrop-blur-xl border border-white/80 p-6 sm:p-7 rounded-[2rem] shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-slate-200 rounded-2xl"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
              <div className="h-10 bg-slate-200 rounded-xl w-3/4"></div>
              <div className="h-12 bg-slate-200 rounded-2xl w-full"></div>
              <div className="h-16 bg-slate-100 rounded-2xl w-full"></div>
              <div className="space-y-2 pt-3">
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
              </div>
            </div>
            <div className="animate-pulse h-48 bg-white/50 backdrop-blur-xl border border-white/80 rounded-[2rem]"></div>
            <div className="animate-pulse h-36 bg-white/50 backdrop-blur-xl border border-white/80 rounded-[2rem]"></div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 min-w-0 space-y-6">
          <Card variant="glass" className="p-6 sm:p-7 animate-pulse rounded-[2rem] border border-white/80">
            <div className="flex justify-between items-center mb-6">
              <div className="h-6 bg-slate-200 rounded-xl w-1/3"></div>
              <div className="h-6 bg-slate-200 rounded-full w-20"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-32"></div>
                    <div className="h-3 bg-slate-200 rounded w-24"></div>
                  </div>
                  <div className="h-8 bg-slate-200 rounded-xl w-24"></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!parentData) return null;

  const bookings = parentData.bookings?.data || [];
  const transactions = wallet?.transactions?.data || [];

  /**
   * Cleans up the transaction description by removing technical jargon/UUIDs
   * and providing user-friendly Arabic text.
   */
  const getFriendlyDescription = (desc: string) => {
    if (!desc) return "عملية مالية";
    
    const lower = desc.toLowerCase();
    if (lower.includes("top-up") || lower.includes("deposit") || desc.includes("شحن")) {
      return "شحن المحفظة الإلكترونية";
    }
    
    if (lower.includes("booking") || lower.includes("deduction") || desc.includes("خصم")) {
      const childMatch = desc.match(/\(([^)]+)\)/) || desc.match(/:\s*([^\s]+)/);
      if (childMatch) {
        return `خصم حجز موعد (${childMatch[1]})`;
      }
      return "خصم لحجز موعد حصة";
    }

    if (lower.includes("refund") || desc.includes("استرجاع") || desc.includes("استرداد")) {
      return "استرداد مبلغ الحجز";
    }

    return desc.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "").replace(/:\s*$/, "").trim() || "عملية مالية";
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-stretch">
      {/* Middle Column: Wallet, Children Balances, Transactions, Help Center */}
      <div className="w-full lg:w-[340px] xl:w-[380px] 2xl:w-[410px] lg:shrink-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 lg:space-y-6 lg:gap-0 lg:sticky lg:top-24">
          {/* 💰 Parent Wallet Card — Ultra-Premium Glassmorphism */}
          <div className="animate-fade-up-1 group relative overflow-hidden rounded-[2rem] border border-white/80 dark:border-white/20 bg-white/40 backdrop-blur-2xl shadow-[0_20px_50px_rgba(79,70,229,0.12)] transition-all duration-500 hover:shadow-[0_30px_60px_rgba(79,70,229,0.22)] hover:-translate-y-1">
            {/* Background Blobs for Ambient Glass Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-white/30 -z-10 pointer-events-none"></div>
            <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-brand-400 opacity-20 blur-[75px] group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-purple-400 opacity-20 blur-[65px] group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>

            {/* Moving Reflection Glint */}
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/35 to-transparent -z-5 skew-x-12 pointer-events-none"></div>

            <div className="relative z-10 p-6 sm:p-7 xl:p-8">
              {/* Card Header */}
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/90 border border-indigo-100/80 flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <WalletCards className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-slate-800 text-xs sm:text-sm font-black tracking-tight">
                      رصيد المحفظة الأساسية
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      المحفظة الرئيسية لولي الأمر
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-1 rounded-full shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  نشطة
                </span>
              </div>

              {/* Primary Balance */}
              <div className="mt-5">
                <CurrencyDisplay 
                  amount={parentData.parent_balance} 
                  size="xl" 
                  className="!justify-start text-slate-900 font-black tracking-tight text-3xl sm:text-4xl"
                />
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  الرصيد المتاح للتحويل وحجز حصص الأبناء
                </p>
              </div>

              {/* CTA Top-up Button */}
              <Button asChild className="mt-6 w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_12px_24px_rgba(79,70,229,0.32)] hover:shadow-[0_16px_32px_rgba(79,70,229,0.42)] rounded-2xl py-6 sm:py-7 font-black transition-all duration-300 active:scale-[0.98] group/btn overflow-hidden relative">
                <Link href="/dashboard/top-up" className="flex items-center justify-center gap-2 text-sm sm:text-base">
                  <span>شحن المحفظة</span>
                  <Zap className="w-5 h-5 text-amber-300 animate-pulse group-hover/btn:rotate-12 transition-transform duration-300" />
                </Link>
              </Button>

              {/* Educational Investment — Luxury Glass Pill */}
              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-white/70 border border-indigo-100/70 backdrop-blur-sm shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/90 text-indigo-600 flex items-center justify-center shadow-2xs border border-indigo-100/60">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      إجمالي الاستثمار التعليمي
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      نفقات الحصص المكتملة
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <CurrencyDisplay 
                    amount={parentData.total_spent} 
                    size="lg" 
                    className="text-indigo-700 font-black text-lg !justify-start"
                  />
                </div>
              </div>

              {/* Children Wallets Breakdown */}
              <div className="mt-6 pt-5 border-t border-slate-200/60">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-slate-700 tracking-wide">
                      أرصدة محافظ الأبناء
                    </h4>
                    {parentData.wallets && parentData.wallets.length > 0 && (
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-full">
                        {parentData.wallets.length}
                      </span>
                    )}
                  </div>
                  <Link 
                    href="/dashboard/children" 
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                  >
                    إدارة الأبناء
                  </Link>
                </div>

                {parentData.wallets?.length === 0 ? (
                  <div className="text-center py-5 bg-white/50 rounded-2xl border border-dashed border-slate-200/80">
                    <Users className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-bold mb-2">
                      لا يوجد أبناء مضافين بعد
                    </p>
                    <Link
                      href="/dashboard/children"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      إضافة حساب ابن جديد
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {parentData.wallets?.map((w, idx) => {
                      const palette = childColorPalettes[idx % childColorPalettes.length];
                      const hasBalance = parseFloat(w.balance) > 0;
                      return (
                        <Link
                          key={w.id}
                          href="/dashboard/children"
                          className="block group/child"
                        >
                          <div className="flex justify-between items-center bg-white/60 backdrop-blur-md p-3 rounded-2xl border border-white/80 shadow-xs hover:bg-white hover:shadow-md hover:border-indigo-100/80 hover:-translate-x-1 transition-all duration-300">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0 transition-transform duration-300 group-hover/child:scale-110 group-hover/child:rotate-3",
                                palette.bg
                              )}>
                                {w.user.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-xs sm:text-sm text-slate-800 block truncate group-hover/child:text-indigo-600 transition-colors">
                                  {w.user.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium block">
                                  حساب الطالب
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0 mr-2">
                              <div className={cn(
                                "px-2.5 py-1 rounded-xl text-xs font-black border transition-colors",
                                hasBalance 
                                  ? "bg-emerald-50/90 border-emerald-200/80 text-emerald-700" 
                                  : "bg-slate-50/80 border-slate-200/60 text-slate-500"
                              )}>
                                <CurrencyDisplay 
                                  amount={w.balance} 
                                  size="sm" 
                                  className="font-black !gap-1"
                                />
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Second Column on Tablet / Stacked below Wallet on Desktop */}
          <div className="space-y-6 flex flex-col justify-between">
            {/* 📊 Recent Transactions — Refined Glass */}
            <Card className="animate-fade-up-2 p-6 bg-white/40 backdrop-blur-xl border border-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[2rem] hover:shadow-[0_15px_35px_rgba(0,0,0,0.05)] transition-all duration-500">
              <div className="flex items-center justify-between mb-5">
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
                        <li className="flex items-center gap-3 p-3 rounded-2xl bg-white/40 hover:bg-white/90 border border-white/60 hover:border-indigo-100 shadow-2xs cursor-pointer transition-all duration-300 group/item hover:-translate-x-0.5">
                          {/* Status Icon */}
                          <div className={cn(
                            "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover/item:scale-110",
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
                              {getFriendlyDescription(tx.description)}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">
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
            <Card className="animate-fade-up-3 p-6 bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-white/80 backdrop-blur-xl border border-blue-100/70 shadow-[0_10px_30px_rgba(59,130,246,0.05)] rounded-[2rem] relative overflow-hidden group hover:shadow-[0_15px_35px_rgba(59,130,246,0.1)] transition-all duration-500">
              <div className="absolute -right-8 -bottom-8 text-blue-200/40 opacity-30 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000 ease-out pointer-events-none">
                <LifeBuoy size={140} strokeWidth={1} />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-200 group-hover:rotate-[360deg] transition-transform duration-1000">
                    <LifeBuoy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-none">مركز المساعدة</h3>
                    <span className="text-[9px] text-blue-600 font-black uppercase tracking-widest">Support Hub</span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 mb-5 leading-relaxed font-bold">
                  هل تواجه مشكلة؟ فريق الدعم متاح لمساعدتك في أي وقت لحل جميع استفساراتك.
                </p>
                
                <Button asChild className="w-full bg-white hover:bg-blue-600 text-blue-600 hover:text-white border-2 border-blue-100 shadow-sm rounded-2xl font-black py-6 transition-all duration-300 active:scale-95 group/btn overflow-hidden relative">
                  <Link href="/dashboard/support" className="flex items-center justify-center gap-2">
                    <span className="relative z-10 text-xs sm:text-sm">فتح تذكرة دعم فني</span>
                    <span className="w-2 h-2 rounded-full bg-blue-500 group-hover/btn:bg-white animate-pulse"></span>
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Bookings Table — Unified with Student/Teacher Dashboard */}
      <div className="flex-1 min-w-0">
        <Card variant="glass" className="h-full flex flex-col p-6 sm:p-7 border border-white/80 dark:border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.03)] rounded-[2rem]">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <h3 className="font-black text-lg sm:text-xl text-text-primary flex items-center gap-3">
              <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-2xs">
                <Calendar className="w-5 h-5" />
              </span>
              سجل حجوزات الأبناء الموحد
            </h3>
            {bookings.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50/90 border border-indigo-100/80 px-3 py-1 rounded-full">
                <span>{bookings.length}</span>
                <span>حصة مسجلة</span>
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <ResponsiveBookingTable 
              bookings={bookings} 
              isTeacher={false}
              isParent={true}
              onCancelClick={handleCancelClick}
              onCompleteClick={handleCompleteClick}
            />
          </div>

          {bookings.length > 0 && (
            <div className="mt-8 border-t border-slate-100/80 pt-6">
              <PaginationControls
                page={parentBookingPage}
                totalPages={parentBookingLastPage}
                onPageChange={setParentBookingPage}
                isLoading={loading}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
