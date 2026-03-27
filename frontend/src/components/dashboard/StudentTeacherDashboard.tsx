/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStatusBadge } from "./utils";
import api from "@/lib/axios";

interface StudentTeacherDashboardProps {
  isTeacher: boolean;
  wallet: any;
  bookings: any[];
  notifications: any[];
  markNotificationAsRead: (id: string) => void;
  onRefresh: () => void;
}

export const StudentTeacherDashboard: React.FC<StudentTeacherDashboardProps> = ({
  isTeacher,
  wallet,
  bookings,
  notifications,
  markNotificationAsRead,
  onRefresh,
}) => {
  const router = useRouter();

  const handleCancelClass = async (bookingId: number) => {
    if (!confirm("هل أنت متأكد من إلغاء الحصة؟ سيتم إرجاع المبلغ للطالب.")) return;
    try {
      const res = await api.patch(`/bookings/${bookingId}/cancel`);
      alert(res.data.message);
      onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.message || "حدث خطأ أثناء الإلغاء");
    }
  };

  const handleCompleteClass = async (bookingId: number) => {
    if (!confirm("هل أنت متأكد من إنهاء الحصة؟ سيتم إيداع الأرباح في محفظتك الآن.")) return;

    try {
      const res = await api.patch(`/bookings/${bookingId}/complete`);
      alert(res.data.message);
      onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.message || "حدث خطأ أثناء إنهاء الحصة");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-md text-white">
          <h3 className="text-blue-100 text-sm font-medium">رصيد المحفظة الحالي</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold">{wallet?.balance || "0.00"}</span>
            <span className="text-blue-200">ريال</span>
          </div>

          {isTeacher ? (
            <div className="mt-6 flex gap-2">
              <Link
                href="/dashboard/schedule"
                className="flex-1 flex justify-center items-center py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition"
              >
                إدارة الجدول 📅
              </Link>
              <Link
                href="/dashboard/payout"
                className="flex-1 flex justify-center items-center py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition border border-white/10"
              >
                طلب سحب
              </Link>
            </div>
          ) : (
            <div className="mt-6 flex gap-2">
              <Link
                href="/dashboard/top-up"
                className="flex-1 text-center py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition"
              >
                شحن المحفظة
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">آخر العمليات المالية</h3>
          {wallet?.transactions?.data?.length === 0 ? (
            <p className="text-gray-500 text-sm text-center">لا توجد عمليات سابقة</p>
          ) : (
            <ul className="space-y-3">
              {wallet?.transactions?.data?.slice(0, 5).map((tx: any) => (
                <li key={tx.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-gray-800">
                      {tx.type === "withdrawal" ? "خصم حجز/تجميد" : "إيداع/أرباح"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`font-bold ${tx.type === "withdrawal" ? "text-red-500" : "text-green-500"}`}>
                    {tx.type === "withdrawal" ? "-" : "+"}
                    {tx.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">مركز المساعدة 🛟</h3>
          <p className="text-sm text-gray-500 mb-4">هل تواجه مشكلة؟ فريق الدعم متاح لمساعدتك في أي وقت.</p>
          <Link
            href="/dashboard/support"
            className="w-full flex justify-center items-center py-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition border border-blue-100"
          >
            فتح تذكرة دعم فني
          </Link>
        </div>
      </div>

      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-gray-900">سجل الحجوزات</h3>
        </div>

        {isTeacher && notifications.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-6">
            <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
              🔔 إشعارات جديدة ({notifications.length})
            </h3>
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div key={notif.id} className="bg-white p-3 rounded-lg shadow-sm border border-yellow-100 flex justify-between items-center">
                  <p className="text-sm text-gray-800 font-semibold">
                    {notif.data.message} - <span className="text-blue-600">{notif.data.booking_date} الساعة {notif.data.time}</span>
                  </p>
                  <button
                    onClick={() => markNotificationAsRead(notif.id)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md text-gray-600 transition"
                  >
                    تحديد كمقروء ✔️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">ليس لديك أي حجوزات حتى الآن.</p>
            {!isTeacher && (
              <Link href="/" className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                احجز حصتك الأولى
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-gray-500 bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 rounded-tr-lg">رقم</th>
                  <th className="px-4 py-3">{isTeacher ? "الطالب" : "المعلم"}</th>
                  <th className="px-4 py-3">التاريخ والوقت</th>
                  <th className="px-4 py-3">المبلغ</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3 rounded-tl-lg">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium">#{booking.id}</td>
                    <td className="px-4 py-3 text-gray-800 font-semibold">
                      {isTeacher ? booking.student?.name : booking.teacher?.name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{booking.booking_date.substring(0, 10)}</div>
                      <div className="text-xs text-gray-500">{booking.teacher_slot?.start_time.substring(0, 5)}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-700">{booking.net_paid} SAR</td>
                    <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
                    <td className="px-4 py-3 flex gap-2 justify-end">
                      {(booking.status === "scheduled" || booking.status === "in_progress") && (
                        <button
                          onClick={() => router.push(`/classroom/${booking.id}`)}
                          className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition text-xs font-bold border border-indigo-200"
                        >
                          دخول الفصل 📹
                        </button>
                      )}
                      {isTeacher && booking.status === "scheduled" && (
                        <button
                          onClick={() => handleCancelClass(booking.id)}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition text-xs font-bold border border-red-200"
                        >
                          إلغاء طارئ ❌
                        </button>
                      )}
                      {isTeacher && booking.status === "in_progress" && (
                        <button
                          onClick={() => handleCompleteClass(booking.id)}
                          className="px-3 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition text-xs font-bold border border-green-200"
                        >
                          إنهاء وتحصيل الأرباح 💰
                        </button>
                      )}
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
