import React from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { ParentDashboardData } from "@/types";
import { formatTimeTo12h } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WalletCards, Zap, Calendar, BookOpen } from "lucide-react";

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
        <div className="animate-fade-in-up-delay relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-6 rounded-3xl shadow-xl text-white">
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
              <span className="text-4xl sm:text-5xl font-bold tracking-tight">
                {parentData.parent_balance || "0.00"}
              </span>
              <span className="text-purple-200 text-base sm:text-lg font-medium">ريال</span>
            </div>

            <Button asChild variant="secondary" className="mt-5 w-full bg-white/20 hover:bg-white/30 text-white border border-white/10 rounded-xl">
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
                <span className="text-2xl font-bold">
                  {parentData.total_spent || "0.00"}
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
                    className="flex justify-between items-center text-sm mb-2 bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-xs font-bold">
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
      <Card className="lg:col-span-2 animate-fade-in-up-delay p-6 border-gray-100/80 bg-white/80 backdrop-blur-sm">
        <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </span>
          سجل حجوزات الأبناء الموحد
        </h3>

        {!parentData.bookings || parentData.bookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              لا توجد حجوزات لأبنائك حتى الآن
            </h4>
            <p className="text-gray-400 text-sm">
              ابدأ بحجز حصص لأبنائك مع نخبة المعلمين
            </p>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-4">
              {parentData.bookings?.map((booking) => (
                <div key={booking.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <span className="font-bold text-indigo-600">#{booking.id}</span>
                    <StatusBadge status={booking.status} />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                      <span className="text-xs text-gray-500 font-bold">الابن</span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {booking.student?.name?.charAt(0) || "?"}
                        </div>
                        <span className="font-bold text-indigo-700 text-sm">
                          {booking.student?.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                      <span className="text-xs text-gray-500 font-bold">المعلم</span>
                      <span className="font-bold text-gray-800 text-sm">
                        {booking.teacher?.name}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl mt-1">
                        <div>
                          <div className="font-bold text-gray-800 text-sm">
                            {booking.booking_date?.substring(0, 10)}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {formatTimeTo12h(booking.teacher_slot?.start_time)}
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="font-bold font-mono text-gray-800" dir="ltr">
                            {booking.net_paid}
                          </span>
                          <span className="text-xs text-gray-400 mr-1">ريال</span>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="bg-gradient-to-l from-gray-50/50 to-slate-50/50 border-b border-gray-100">
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider rounded-tr-2xl text-right">
                      الابن
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                      المعلم
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                      التاريخ والوقت
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                      التكلفة
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider rounded-tl-2xl text-right">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parentData.bookings?.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-indigo-50/50 transition-all duration-200"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {booking.student?.name?.charAt(0) || "?"}
                          </div>
                          <span className="font-bold text-indigo-700">
                            {booking.student?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-bold text-gray-800">
                        {booking.teacher?.name}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-gray-800">
                          {booking.booking_date?.substring(0, 10)}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {formatTimeTo12h(booking.teacher_slot?.start_time)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold font-mono text-gray-800" dir="ltr">
                          {booking.net_paid}
                        </span>
                        <span className="text-xs text-gray-400 mr-1">ريال</span>
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
