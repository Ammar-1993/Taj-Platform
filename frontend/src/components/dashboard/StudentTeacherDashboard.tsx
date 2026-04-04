import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import api from "@/lib/axios";
import { Wallet, Booking, AppNotification } from "@/types";
import { formatTimeTo12h } from "@/lib/utils";
import toast from "react-hot-toast";
import { showApiError } from "@/hooks/useApiError";

interface StudentTeacherDashboardProps {
  isTeacher: boolean;
  wallet: Wallet | null;
  bookings: Booking[];
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  onRefresh: () => void;
}

export const StudentTeacherDashboard: React.FC<
  StudentTeacherDashboardProps
> = ({
  isTeacher,
  wallet,
  bookings,
  notifications,
  markNotificationAsRead,
  onRefresh,
}) => {
  const router = useRouter();

  // حالات مربعات التأكيد
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: "cancel" | "complete";
    bookingId: number;
  }>({ isOpen: false, type: "cancel", bookingId: 0 });
  const [actionLoading, setActionLoading] = useState(false);

  const handleCancelClass = async () => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/bookings/${confirmState.bookingId}/cancel`);
      toast.success(res.data.message || "تم إلغاء الحصة بنجاح.");
      onRefresh();
    } catch (err: unknown) {
      showApiError(err, "حدث خطأ أثناء الإلغاء");
    } finally {
      setActionLoading(false);
      setConfirmState({ isOpen: false, type: "cancel", bookingId: 0 });
    }
  };

  const handleCompleteClass = async () => {
    setActionLoading(true);
    try {
      const res = await api.patch(
        `/bookings/${confirmState.bookingId}/complete`,
      );
      toast.success(res.data.message || "تم إنهاء الحصة وإيداع الأرباح.");
      onRefresh();
    } catch (err: unknown) {
      showApiError(err, "حدث خطأ أثناء إنهاء الحصة");
    } finally {
      setActionLoading(false);
      setConfirmState({ isOpen: false, type: "complete", bookingId: 0 });
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ============ SIDEBAR ============ */}
        <div className="lg:col-span-1 space-y-6">
          {/* 💰 Wallet Card — Premium Gradient */}
          <div className="animate-fade-in-up-delay relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-6 rounded-3xl shadow-xl text-white">
            {/* Decorative Pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-violet-300 blur-2xl"></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">💳</span>
                <h3 className="text-purple-200 text-sm font-bold">
                  رصيد المحفظة
                </h3>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tight">
                  {wallet?.balance || "0.00"}
                </span>
                <span className="text-purple-200 text-lg font-medium">
                  ريال
                </span>
              </div>

              {isTeacher ? (
                <div className="mt-6 flex gap-2">
                  <Link
                    href="/dashboard/schedule"
                    className="flex-1 flex justify-center items-center py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all duration-200 backdrop-blur-sm border border-white/10 hover:-translate-y-0.5"
                  >
                    إدارة الجدول 📅
                  </Link>
                  <Link
                    href="/dashboard/payout"
                    className="flex-1 flex justify-center items-center py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all duration-200 backdrop-blur-sm border border-white/10 hover:-translate-y-0.5"
                  >
                    طلب سحب 💸
                  </Link>
                </div>
              ) : (
                <div className="mt-6">
                  <Link
                    href="/dashboard/top-up"
                    className="w-full flex justify-center items-center py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all duration-200 backdrop-blur-sm border border-white/10 hover:-translate-y-0.5"
                  >
                    شحن المحفظة ⚡
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* 📊 Transaction History */}
          <div className="animate-fade-in-up-delay-2 bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-gray-100/80">
            <h3 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">
                📊
              </span>
              آخر العمليات المالية
            </h3>
            {wallet?.transactions?.data?.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">🏦</div>
                <p className="text-gray-400 text-sm">لا توجد عمليات سابقة</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {wallet?.transactions?.data?.slice(0, 5).map((tx) => (
                  <li
                    key={tx.id}
                    className="flex justify-between items-center text-sm p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-8 rounded-full ${tx.type === "withdrawal" ? "bg-red-400" : "bg-emerald-400"}`}
                      ></div>
                      <div>
                        <p className="font-bold text-gray-800">
                          {tx.type === "withdrawal"
                            ? "خصم حجز/تجميد"
                            : "إيداع/أرباح"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString("ar-SA")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-black text-base ${tx.type === "withdrawal" ? "text-red-500" : "text-emerald-500"}`}
                    >
                      {tx.type === "withdrawal" ? "-" : "+"}
                      {tx.amount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 🛟 Support Center */}
          <div className="animate-fade-in-up-delay-2 bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-gray-100/80">
            <h3 className="font-extrabold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">
                🛟
              </span>
              مركز المساعدة
            </h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              هل تواجه مشكلة؟ فريق الدعم متاح لمساعدتك في أي وقت.
            </p>
            <Link
              href="/dashboard/support"
              className="w-full flex justify-center items-center py-3 bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              فتح تذكرة دعم فني
            </Link>
          </div>
        </div>

        {/* ============ MAIN CONTENT ============ */}
        <div className="lg:col-span-3 animate-fade-in-up-delay bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-gray-100/80">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-xl text-gray-900 flex items-center gap-2">
              <span className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-base">
                📋
              </span>
              سجل الحجوزات
            </h3>
          </div>

          {/* 🔔 Notifications for Teachers */}
          {isTeacher && notifications.length > 0 && (
            <div className="bg-gradient-to-l from-amber-50 to-yellow-50 border border-amber-200/60 p-5 rounded-2xl mb-6">
              <h3 className="font-extrabold text-amber-800 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 bg-amber-200 rounded-lg flex items-center justify-center text-sm">
                  🔔
                </span>
                إشعارات جديدة ({notifications.length})
              </h3>
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="bg-white/90 p-3 rounded-xl shadow-sm border border-amber-100 flex justify-between items-center hover:shadow-md transition-all duration-200"
                  >
                    <p className="text-sm text-gray-800 font-bold">
                      {notif.data.message} -{" "}
                      <span className="text-indigo-600">
                        {notif.data.booking_date} الساعة {notif.data.time}
                      </span>
                    </p>
                    <button
                      onClick={() => markNotificationAsRead(notif.id)}
                      className="text-xs bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-amber-700 transition-all duration-200 font-bold"
                    >
                      تحديد كمقروء ✔️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bookings Content */}
          {bookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">
                📚
              </div>
              <h4 className="text-xl font-extrabold text-gray-800 mb-2">
                ليس لديك أي حجوزات حتى الآن
              </h4>
              <p className="text-gray-400 text-sm mb-6">
                ابدأ رحلتك التعليمية بحجز حصتك الأولى مع نخبة المعلمين
              </p>
              {!isTeacher && (
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-l from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 text-sm"
                >
                  احجز حصتك الأولى 🚀
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="bg-gradient-to-l from-gray-50 to-slate-50 border-b border-gray-200">
                    <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider rounded-tr-xl">
                      رقم
                    </th>
                    <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      {isTeacher ? "الطالب" : "المعلم"}
                    </th>
                    <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      التاريخ والوقت
                    </th>
                    <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      المبلغ
                    </th>
                    <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-4 py-3.5 text-xs font-extrabold text-gray-500 uppercase tracking-wider rounded-tl-xl">
                      الإجراء
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-indigo-50/50 transition-all duration-200 group"
                    >
                      <td className="px-4 py-4 font-bold text-indigo-600">
                        #{booking.id}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-indigo-600 font-extrabold text-sm">
                            {(isTeacher
                              ? booking.student?.name
                              : booking.teacher?.name
                            )?.charAt(0) || "?"}
                          </div>
                          <span className="font-bold text-gray-800">
                            {isTeacher
                              ? booking.student?.name
                              : booking.teacher?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-gray-800">
                          {booking.booking_date.substring(0, 10)}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {formatTimeTo12h(booking.teacher_slot?.start_time)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-black text-gray-800">
                          {booking.net_paid}
                        </span>
                        <span className="text-xs text-gray-400 mr-1">
                          ريال
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 justify-end">
                          {(booking.status === "scheduled" ||
                            booking.status === "in_progress") && (
                            <button
                              onClick={() =>
                                router.push(`/classroom/${booking.id}`)
                              }
                              className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all duration-200 text-xs font-bold hover:shadow-md hover:-translate-y-0.5"
                            >
                              دخول الفصل 📹
                            </button>
                          )}
                          {isTeacher && booking.status === "scheduled" && (
                            <button
                              onClick={() =>
                                setConfirmState({
                                  isOpen: true,
                                  type: "cancel",
                                  bookingId: booking.id,
                                })
                              }
                              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 text-xs font-bold hover:shadow-md hover:-translate-y-0.5"
                            >
                              إلغاء طارئ ❌
                            </button>
                          )}
                          {isTeacher && booking.status === "in_progress" && (
                            <button
                              onClick={() =>
                                setConfirmState({
                                  isOpen: true,
                                  type: "complete",
                                  bookingId: booking.id,
                                })
                              }
                              className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all duration-200 text-xs font-bold hover:shadow-md hover:-translate-y-0.5"
                            >
                              إنهاء وتحصيل 💰
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* مربعات التأكيد */}
      <ConfirmDialog
        isOpen={confirmState.isOpen && confirmState.type === "cancel"}
        title="إلغاء الحصة"
        message="هل أنت متأكد من إلغاء الحصة؟ سيتم إرجاع المبلغ للطالب."
        confirmText="تأكيد الإلغاء"
        variant="danger"
        isLoading={actionLoading}
        onConfirm={handleCancelClass}
        onCancel={() =>
          setConfirmState({ isOpen: false, type: "cancel", bookingId: 0 })
        }
      />
      <ConfirmDialog
        isOpen={confirmState.isOpen && confirmState.type === "complete"}
        title="إنهاء الحصة وتحصيل الأرباح"
        message="هل أنت متأكد من إنهاء الحصة؟ سيتم إيداع الأرباح في محفظتك الآن."
        confirmText="إنهاء وتحصيل"
        variant="info"
        isLoading={actionLoading}
        onConfirm={handleCompleteClass}
        onCancel={() =>
          setConfirmState({ isOpen: false, type: "complete", bookingId: 0 })
        }
      />
    </>
  );
};
