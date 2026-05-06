import React from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { ParentDashboardData, Wallet } from "@/types";
import { formatTime, formatDate, formatCurrency } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  WalletCards, Zap, Calendar, BookOpen, 
  BarChart2, Landmark, LifeBuoy 
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { PaginationControls } from "@/components/ui/PaginationControls";

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
        {/* 💰 Parent Wallet Card */}
        <div className="animate-fade-up-1 relative overflow-hidden bg-gradient-to-br from-brand-600 via-purple-600 to-violet-700 p-6 rounded-taj-xl shadow-xl text-white">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-violet-300 blur-2xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <WalletCards className="w-6 h-6 text-purple-200" />
              <h3 className="text-purple-200 text-sm font-bold">
                رصيد المحفظة الأساسية
              </h3>
            </div>
            <div className="mt-3 flex items-baseline justify-end gap-2" dir="ltr">
              <span className="font-mono text-4xl sm:text-5xl font-bold tracking-tight" dir="ltr">
                {formatCurrency(parentData.parent_balance, "number")}
              </span>
              <span className="text-purple-200 text-base sm:text-lg font-medium" dir="rtl">ريال</span>
            </div>

            <Button asChild variant="secondary" className="mt-5 w-full bg-white/20 hover:bg-white/30 text-white border border-white/10 rounded-taj-md">
              <Link href="/dashboard/top-up">
                شحن المحفظة <Zap className="w-4 h-4 mr-2" />
              </Link>
            </Button>

            {/* إجمالي الإنفاق */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <h3 className="text-purple-200 text-xs font-bold mb-1">
                إجمالي الاستثمار في التعليم
              </h3>
              <div className="flex items-baseline gap-2">
                <div className="flex items-center justify-end gap-1 font-bold font-mono text-white text-xl" dir="ltr">
                  <span dir="ltr">{formatCurrency(parentData.total_spent, "number")}</span>
                  <span className="text-sm font-sans text-purple-200" dir="rtl">ريال</span>
                </div>
              </div>
            </div>

            {/* محافظ الأبناء */}
            <div className="mt-5 pt-3 border-t border-white/20">
              <h4 className="text-[10px] font-black mb-2 text-purple-200">
                أرصدة محافظ الأبناء:
              </h4>
              {parentData.wallets?.length === 0 ? (
                <p className="text-xs text-purple-300">
                  لا يوجد أبناء مضافين بعد.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {parentData.wallets?.map((w) => (
                    <div
                      key={w.id}
                      className="flex justify-between items-center text-sm bg-white/10 backdrop-blur-sm p-2 rounded-taj-md border border-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-white/20 rounded-taj-sm flex items-center justify-center text-[10px] font-bold">
                          {w.user.name.charAt(0)}
                        </div>
                        <span className="font-bold text-xs">{w.user.name}</span>
                      </div>
                      <div className="flex items-center gap-1" dir="ltr">
                        <span className="font-bold text-xs">{w.balance}</span>
                        <span className="text-[10px] text-purple-200" dir="rtl">ريال</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 📊 Recent Transactions */}
        <Card variant="glass" className="animate-fade-up-2 p-5 border-border bg-white/80 backdrop-blur-sm">
          <div className="flex items-center mb-4">
            <h3 className="font-bold text-text-primary text-sm flex items-center gap-2">
              <span className="w-8 h-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </span>
              آخر العمليات المالية
            </h3>
          </div>

          {transactions.length === 0 ? (
            <EmptyState icon={Landmark} title="لا توجد عمليات سابقة" className="py-6" />
          ) : (
            <ul className="space-y-3">
              {transactions.slice(0, 2).map((tx) => (
                <li
                  key={tx.id}
                  className="flex justify-between items-center text-sm p-3 rounded-xl bg-surface-subtle hover:bg-surface-muted transition-all duration-200 group border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-1 h-8 rounded-full ${tx.type === "withdrawal" ? "bg-red-500" : "bg-green-500"}`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-primary text-xs leading-tight truncate">
                        {getFriendlyDescription(tx.description)}
                      </p>
                      <p className="text-[10px] text-text-muted mt-1 font-medium">
                        {formatDate(tx.created_at, "medium")}
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1"
                    dir="ltr"
                  >
                    <span className={`font-medium font-mono text-sm ${tx.type === "withdrawal" ? "text-red-500" : "text-green-500"}`}>
                      {tx.type === "withdrawal" ? "-" : "+"}
                      {formatCurrency(tx.amount, "number")}
                    </span>
                    <span className="text-gray-500 text-sm" dir="rtl">ريال</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 🛟 Help Center Card - Compact Banner */}
        <Card variant="glass" className="animate-fade-up-3 p-4 border-border bg-white/80 backdrop-blur-sm">
          <h3 className="font-bold text-text-primary text-sm mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <LifeBuoy className="w-4 h-4" />
            </span>
            مركز المساعدة
          </h3>
          <Button asChild variant="outline" className="w-full border-blue-100 text-blue-700 hover:bg-blue-50 hover:text-blue-800 rounded-taj-md text-xs font-bold h-9">
            <Link href="/dashboard/support">
              فتح تذكرة دعم فني
            </Link>
          </Button>
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
                          <div className="flex items-center justify-end gap-1 font-bold font-mono text-text-primary text-lg" dir="ltr">
                            <span dir="ltr">{formatCurrency(booking.net_paid, "number")}</span>
                            <span className="text-xs font-sans text-text-secondary" dir="rtl">ريال</span>
                          </div>
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
                        <div className="flex items-center justify-end gap-1" dir="ltr">
                          <span className="font-bold font-mono text-text-primary" dir="ltr">
                            {formatCurrency(booking.net_paid, "number")}
                          </span>
                          <span className="text-xs font-sans text-text-secondary" dir="rtl">ريال</span>
                        </div>
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
