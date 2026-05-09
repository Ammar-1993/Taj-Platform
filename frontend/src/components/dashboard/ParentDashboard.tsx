import React from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { ParentDashboardData, Wallet } from "@/types";
import { formatTime, formatDate } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  WalletCards, Zap, Calendar, BookOpen, 
  BarChart2, Landmark, LifeBuoy 
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

interface ParentDashboardProps {
  parentData: ParentDashboardData | null;
  wallet: Wallet | null;
  parentBookingPage: number;
  parentBookingLastPage: number;
  setParentBookingPage: (page: number) => void;
  loading?: boolean;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  parentData,
  wallet,
  parentBookingPage,
  parentBookingLastPage,
  setParentBookingPage,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar: Wallet Skeleton */}
        <div className="w-full lg:w-80 lg:shrink-0">
          <div className="space-y-6 lg:sticky lg:top-28">
            <div className="animate-pulse bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 p-6 rounded-taj-xl shadow-xl">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-12 bg-gray-200 rounded w-3/4"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
            <div className="animate-pulse h-64 bg-gray-200 rounded-taj-xl"></div>
            <div className="animate-pulse h-32 bg-gray-200 rounded-taj-xl"></div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 min-w-0 space-y-6">
          <Card variant="glass" className="p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-100 p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
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
   * and providing a more user-friendly Arabic text.
   */
  const getFriendlyDescription = (desc: string) => {
    if (!desc) return "عملية مالية";
    
    // Mapping common technical descriptions to friendly Arabic text
    if (desc.toLowerCase().includes("top-up") || desc.toLowerCase().includes("deposit")) {
      return "شحن المحفظة";
    }
    
    if (desc.toLowerCase().includes("booking") || desc.toLowerCase().includes("deduction")) {
      // If the description contains a child's name in parentheses or after a colon, keep it
      const childMatch = desc.match(/\(([^)]+)\)/) || desc.match(/:\s*([^\s]+)/);
      if (childMatch) {
        return `خصم حجز (${childMatch[1]})`;
      }
      return "خصم حجز حصة";
    }

    // Fallback: Remove UUIDs or long hex strings
    return desc.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "").replace(/:\s*$/, "").trim() || "عملية مالية";
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Sidebar: Wallet, Transactions, and Help Center */}
      <div className="w-full lg:w-80 lg:shrink-0 space-y-6 lg:sticky lg:top-24">
        {/* 💰 Parent Wallet Card — Premium Glassmorphism */}
        <div className="animate-fade-up-1 group relative overflow-hidden rounded-taj-xl shadow-glass transition-all duration-300">
          {/* Background Blobs for Glass Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-indigo-100/30 -z-10"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-400 opacity-20 blur-3xl group-hover:opacity-30 transition-opacity"></div>
          <div className="absolute bottom-0 -left-10 w-32 h-32 rounded-full bg-purple-400 opacity-20 blur-2xl"></div>

          <div className="relative z-10 bg-white/40 backdrop-blur-xl border border-white/60 p-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shadow-sm">
                <WalletCards className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-wider">
                رصيد المحفظة الأساسية
              </h3>
            </div>
            
            <CurrencyDisplay 
              amount={parentData.parent_balance} 
              size="xl" 
              className="mt-4 !justify-start text-slate-900 font-black tracking-tight"
            />

            <Button asChild className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 rounded-xl py-6 font-bold">
              <Link href="/dashboard/top-up">
                شحن المحفظة <Zap className="w-4 h-4 mr-2" />
              </Link>
            </Button>

            {/* إجمالي الإنفاق */}
            <div className="mt-6 pt-4 border-t border-white/40">
              <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">
                إجمالي الاستثمار التعليمي
              </h3>
              <CurrencyDisplay 
                amount={parentData.total_spent} 
                size="lg" 
                className="!justify-start text-indigo-600 font-bold"
              />
            </div>

            {/* محافظ الأبناء */}
            <div className="mt-5 pt-3 border-t border-white/40">
              <h4 className="text-[10px] font-black mb-3 text-slate-400 uppercase tracking-wider">
                أرصدة محافظ الأبناء:
              </h4>
              {parentData.wallets?.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium">
                  لا يوجد أبناء مضافين بعد.
                </p>
              ) : (
                <div className="space-y-2">
                  {parentData.wallets?.map((w) => (
                    <div
                      key={w.id}
                      className="flex justify-between items-center text-sm bg-white/50 backdrop-blur-sm p-2.5 rounded-xl border border-white/60 shadow-sm hover:bg-white transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center text-[10px] font-bold text-brand-600 shadow-inner">
                          {w.user.name.charAt(0)}
                        </div>
                        <span className="font-bold text-xs text-slate-700">{w.user.name}</span>
                      </div>
                      <CurrencyDisplay 
                        amount={w.balance} 
                        size="sm" 
                        className="text-slate-900 font-bold"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 📊 Recent Transactions */}
        <Card className="animate-fade-up-2 p-5 bg-white/60 backdrop-blur-lg border-white/60 shadow-sm rounded-taj-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2">
              <span className="w-8 h-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center shadow-sm">
                <BarChart2 className="w-4 h-4" />
              </span>
              آخر العمليات المالية
            </h3>
            <Link 
              href="/dashboard/financial-record" 
              className="text-[10px] font-black text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full transition-colors"
            >
              عرض الكل
            </Link>
          </div>

          {transactions.length === 0 ? (
            <EmptyState icon={Landmark} title="لا توجد عمليات سابقة" className="py-6 bg-slate-50/50 rounded-2xl border-dashed" />
          ) : (
            <ul className="space-y-3">
              {transactions.slice(0, 2).map((tx) => (
                <li
                  key={tx.id}
                  className="flex justify-between items-center text-sm p-3 rounded-2xl bg-white/50 hover:bg-white transition-all duration-300 group border border-transparent hover:border-brand-100 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-1 h-8 rounded-full ${tx.type === "withdrawal" || parseFloat(String(tx.amount)) < 0 ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.3)]" : "bg-green-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]"}`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-[10px] leading-tight truncate">
                        {getFriendlyDescription(tx.description)}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1 font-bold">
                        {formatDate(tx.created_at, "medium")}
                      </p>
                    </div>
                  </div>
                  <CurrencyDisplay 
                    amount={tx.amount} 
                    showSign 
                    colorStatus 
                    size="md"
                    className="font-bold"
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 🛟 Help Center Card — Unified Format */}
        <Card className="animate-fade-up-3 p-6 bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm rounded-taj-xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 text-blue-100 opacity-40 group-hover:scale-110 transition-transform duration-500">
            <LifeBuoy size={100} strokeWidth={1} />
          </div>

          <div className="relative z-10">
            <h3 className="font-bold text-slate-800 mb-2.5 flex items-center gap-2">
              <span className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <LifeBuoy className="w-5 h-5" />
              </span>
              مركز المساعدة
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed font-medium">
              هل تواجه مشكلة؟ فريق الدعم متاح لمساعدتك في أي وقت.
            </p>
            <Button asChild className="w-full bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 shadow-sm rounded-xl font-bold py-5 transition-all active:scale-[0.98]">
              <Link href="/dashboard/support">
                فتح تذكرة دعم فني
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card className="flex-1 min-w-0 animate-fade-up-1 p-6 border-border bg-white/80 backdrop-blur-sm">
        <h3 className="font-bold text-xl text-text-primary mb-6 flex items-center gap-2">
          <span className="w-9 h-9 bg-brand-50 text-brand-600 rounded-taj-md flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </span>
          سجل حجوزات الأبناء الموحد
        </h3>

        {!bookings || bookings.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="لا توجد حجوزات لأبنائك حتى الآن"
            subtitle="ابدأ بحجز حصص لأبنائك مع نخبة المعلمين"
            action={{ label: "ابحث عن معلم", href: "/dashboard/teachers" }}
          />
        ) : (
          <>
            <div className="md:hidden space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-white border border-border rounded-taj-lg p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-surface-subtle pb-3">
                    <span className="font-bold text-brand-600">#{booking.id}</span>
                    <StatusBadge status={booking.status} />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center bg-surface-subtle p-3 rounded-taj-md">
                      <span className="text-xs text-text-secondary font-bold">الابن</span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-brand-50 rounded flex items-center justify-center text-brand-600 font-bold text-xs">
                          {booking.student?.name?.charAt(0) || "?"}
                        </div>
                        <span className="font-bold text-brand-700 text-sm">
                          {booking.student?.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-surface-subtle p-3 rounded-taj-md">
                      <span className="text-xs text-text-secondary font-bold">المعلم</span>
                      <span className="font-bold text-text-primary text-sm">
                        {booking.teacher?.name}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-surface-subtle p-3 rounded-taj-md mt-1">
                        <div>
                          <div className="font-bold text-text-primary text-sm">
                            {formatDate(booking.booking_date, "medium")}
                          </div>
                          <div className="text-xs text-text-secondary mt-0.5">
                            {formatTime(booking.teacher_slot?.start_time)}
                          </div>
                        </div>
                        <div className="text-left">
                          <CurrencyDisplay 
                            amount={booking.net_paid} 
                            size="lg" 
                            className="text-text-primary"
                          />
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block w-full overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="bg-gradient-to-l from-surface-subtle to-surface-muted border-b border-border">
                    <th className="px-4 py-4 text-xs font-bold text-text-secondary text-right rounded-tr-taj-lg">
                      الابن
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-text-secondary text-right">
                      المعلم
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-text-secondary text-right">
                      التاريخ والوقت
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-text-secondary text-right">
                      التكلفة
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-text-secondary text-right rounded-tl-taj-lg">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-subtle">
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-brand-50/50 transition-all duration-200"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-brand-100 to-purple-100 rounded-taj-sm flex items-center justify-center text-brand-600 font-bold text-xs">
                            {booking.student?.name?.charAt(0) || "?"}
                          </div>
                          <span className="font-bold text-brand-700">
                            {booking.student?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-bold text-text-primary">
                        {booking.teacher?.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-bold text-text-primary">
                          {formatDate(booking.booking_date, "medium")}
                        </div>
                        <div className="text-xs text-text-muted mt-0.5">
                          {formatTime(booking.teacher_slot?.start_time)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <CurrencyDisplay 
                          amount={booking.net_paid} 
                          size="md" 
                          className="text-text-primary"
                        />
                      </td>
                      <td className="px-4 py-4">
                      <StatusBadge status={booking.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationControls
              page={parentBookingPage}
              totalPages={parentBookingLastPage}
              onPageChange={setParentBookingPage}
              isLoading={loading}
            />
          </>
        )}
      </Card>
    </div>
  );
};
