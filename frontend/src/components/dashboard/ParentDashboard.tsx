import React from "react";
import Link from "next/link";
import { getStatusBadge } from "./utils";
import { ParentDashboardData } from "@/types";

interface ParentDashboardProps {
  parentData: ParentDashboardData | null;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ parentData }) => {
  if (!parentData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white h-fit">
        {/* رصيد ولي الأمر الأساسي وزر الشحن */}
        <h3 className="text-indigo-100 text-sm font-medium">رصيد المحفظة الأساسية</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold">{parentData.parent_balance || "0.00"}</span>
          <span className="text-indigo-200">ريال</span>
        </div>

        <Link
          href="/dashboard/top-up"
          className="mt-5 flex justify-center items-center w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition"
        >
          شحن المحفظة 💳
        </Link>

        {/* إجمالي الإنفاق */}
        <div className="mt-6 pt-4 border-t border-indigo-500/30">
          <h3 className="text-indigo-100 text-xs font-medium mb-1">إجمالي الاستثمار في التعليم (الإنفاق)</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{parentData.total_spent || "0.00"}</span>
            <span className="text-indigo-200 text-xs">SAR</span>
          </div>
        </div>

        {/* محافظ الأبناء */}
        <div className="mt-6 pt-4 border-t border-indigo-500/30">
          <h4 className="text-xs font-bold mb-3 opacity-80">أرصدة محافظ الأبناء الحالية:</h4>
          {parentData.wallets?.length === 0 ? (
            <p className="text-xs text-indigo-200">لا يوجد أبناء مضافين بعد.</p>
          ) : (
            parentData.wallets?.map((w) => (
              <div key={w.id} className="flex justify-between items-center text-sm mb-2 bg-indigo-900/30 p-2 rounded-lg">
                <span>{w.user.name}</span>
                <span className="font-bold">{w.balance} SAR</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* جدول حجوزات الأبناء */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
        <h3 className="font-bold text-lg text-gray-900 mb-6">سجل حجوزات الأبناء الموحد 📅</h3>

        {!parentData.bookings || parentData.bookings.length === 0 ? (
          <p className="text-gray-500 text-center py-10">لا توجد حجوزات لأبنائك حتى الآن.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-gray-500 bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">الابن</th>
                  <th className="px-4 py-3">المعلم</th>
                  <th className="px-4 py-3">التاريخ والوقت</th>
                  <th className="px-4 py-3">التكلفة</th>
                  <th className="px-4 py-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {parentData.bookings?.map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-bold text-indigo-700">{booking.student?.name}</td>
                    <td className="px-4 py-3 text-gray-800">{booking.teacher?.name}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{booking.booking_date?.substring(0, 10)}</div>
                      <div className="text-xs text-gray-500">{booking.teacher_slot?.start_time?.substring(0, 5)}</div>
                    </td>
                    <td className="px-4 py-3 font-bold">{booking.net_paid} SAR</td>
                    <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
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
