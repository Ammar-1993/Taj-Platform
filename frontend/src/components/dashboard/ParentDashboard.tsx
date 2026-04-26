import React from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { ParentDashboardData } from "@/types";
import { formatTime, formatDate, formatCurrency } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WalletCards, Zap, Calendar, BookOpen } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

interface ParentDashboardProps {
  parentData: ParentDashboardData | null;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  parentData,
}) => {
  if (!parentData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar: Wallet */}
      <div className="lg:col-span-1">
        <div className="space-y-6 sticky top-28">
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
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-4xl sm:text-5xl font-bold tracking-tight">
                {formatCurrency(parentData.parent_balance)}
              </span>
              <span className="text-purple-200 text-base sm:text-lg font-medium">ريال</span>
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
                <span className="font-mono text-2xl font-bold">
                  {formatCurrency(parentData.total_spent)}
                </span>
                <span className="text-purple-200 text-xs">ريال</span>
              </div>
            </div>

            {/* محافظ الأبناء */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <h4 className="text-xs font-bold mb-3 text-purple-200">
                أرصدة محافظ الأبناء:
              </h4>
              {parentData.wallets?.length === 0 ? (
                <p className="text-xs text-purple-300">
                  لا يوجد أبناء مضافين بعد.
                </p>
              ) : (
                parentData.wallets?.map((w) => (
                  <div
                    key={w.id}
                    className="flex justify-between items-center text-sm mb-2 bg-white/10 backdrop-blur-sm p-2.5 rounded-taj-md border border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-white/20 rounded-taj-sm flex items-center justify-center text-xs font-bold">
                        {w.user.name.charAt(0)}
                      </div>
                      <span className="font-bold">{w.user.name}</span>
                    </div>
                    <span className="font-bold">
                      {w.balance}{" "}
                      <span className="text-xs text-purple-200">ريال</span>
                    </span>
                  </div>
                ))
              )}
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <Card className="lg:col-span-2 animate-fade-up-1 p-6 border-border bg-white/80 backdrop-blur-sm">
        <h3 className="font-bold text-xl text-text-primary mb-6 flex items-center gap-2">
          <span className="w-9 h-9 bg-brand-50 text-brand-600 rounded-taj-md flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </span>
          سجل حجوزات الأبناء الموحد
        </h3>

        {!parentData.bookings || parentData.bookings.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="لا توجد حجوزات لأبنائك حتى الآن"
            subtitle="ابدأ بحجز حصص لأبنائك مع نخبة المعلمين"
            action={{ label: "ابحث عن معلم", href: "/dashboard/teachers" }}
          />
        ) : (
          <>
            <div className="md:hidden space-y-4">
              {parentData.bookings?.map((booking) => (
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
                          <span className="font-bold font-mono text-text-primary" dir="ltr">
                            {formatCurrency(booking.net_paid)}
                          </span>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="bg-gradient-to-l from-surface-subtle to-surface-muted border-b border-border">
                    <th className="px-4 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider rounded-tr-taj-lg text-right">
                      الابن
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">
                      المعلم
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">
                      التاريخ والوقت
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">
                      التكلفة
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider rounded-tl-taj-lg text-right">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-subtle">
                  {parentData.bookings?.map((booking) => (
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
                      <td className="px-4 py-4">
                        <div className="font-bold text-text-primary">
                          {formatDate(booking.booking_date, "medium")}
                        </div>
                        <div className="text-xs text-text-muted mt-0.5">
                          {formatTime(booking.teacher_slot?.start_time)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold font-mono text-text-primary" dir="ltr">
                          {booking.net_paid}
                        </span>
                        <span className="text-xs text-text-muted mr-1">ريال</span>
                      </td>
                      <td className="px-4 py-4">
                      <StatusBadge status={booking.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
