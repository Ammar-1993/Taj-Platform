import React from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { ParentDashboardData } from "@/types";
import { formatTimeTo12h } from "@/lib/utils";

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
      <div className="lg:col-span-1 space-y-6">
        {/* 💰 Parent Wallet Card */}
        <div className="animate-fade-in-up-delay relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-6 rounded-3xl shadow-xl text-white">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-violet-300 blur-2xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">💳</span>
              <h3 className="text-purple-200 text-sm font-bold">
                رصيد المحفظة الأساسية
              </h3>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight">
                {parentData.parent_balance || "0.00"}
              </span>
              <span className="text-purple-200 text-lg font-medium">ريال</span>
            </div>

            <Link
              href="/dashboard/top-up"
              className="mt-5 flex justify-center items-center w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all duration-200 backdrop-blur-sm border border-white/10 hover:-translate-y-0.5"
            >
              شحن المحفظة ⚡
            </Link>

            {/* إجمالي الإنفاق */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <h3 className="text-purple-200 text-xs font-bold mb-1">
                إجمالي الاستثمار في التعليم
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black">
                  {parentData.total_spent || "0.00"}
                </span>
                <span className="text-purple-200 text-xs">ريال</span>
              </div>
            </div>

            {/* محافظ الأبناء */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <h4 className="text-xs font-extrabold mb-3 text-purple-200">
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
                      <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-xs font-black">
                        {w.user.name.charAt(0)}
                      </div>
                      <span className="font-bold">{w.user.name}</span>
                    </div>
                    <span className="font-black">
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

      {/* Bookings Table */}
      <div className="lg:col-span-2 animate-fade-in-up-delay bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-gray-100/80">
        <h3 className="font-extrabold text-xl text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-base">
            📅
          </span>
          سجل حجوزات الأبناء الموحد
        </h3>

        {!parentData.bookings || parentData.bookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">
              📚
            </div>
            <h4 className="text-xl font-extrabold text-gray-800 mb-2">
              لا توجد حجوزات لأبنائك حتى الآن
            </h4>
            <p className="text-gray-400 text-sm">
              ابدأ بحجز حصص لأبنائك مع نخبة المعلمين
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="bg-gradient-to-l from-gray-50 to-slate-50 border-b border-gray-200">
                  <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider rounded-tr-xl">
                    الابن
                  </th>
                  <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    المعلم
                  </th>
                  <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    التاريخ والوقت
                  </th>
                  <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    التكلفة
                  </th>
                  <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider rounded-tl-xl">
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
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center text-indigo-600 font-extrabold text-xs">
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
                      <span className="font-black text-gray-800">
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
        )}
      </div>
    </div>
  );
};
