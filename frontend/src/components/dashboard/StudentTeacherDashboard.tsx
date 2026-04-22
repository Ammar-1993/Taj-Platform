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
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  WalletCards, CalendarDays, Banknote, Zap, BarChart2,
  Landmark, LifeBuoy, ClipboardList, Bell, Check, BookOpen, Rocket, Video, XCircle, Coins
} from "lucide-react";

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============ SIDEBAR ============ */}
        <div className="lg:col-span-1">
          <div className="space-y-6 sticky top-28">
            {/* 💰 Wallet Card — Premium Gradient */}
          <div className="animate-fade-in-up-delay relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-6 rounded-3xl shadow-xl text-white">
            {/* Decorative Pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-violet-300 blur-2xl"></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <WalletCards className="w-6 h-6 text-purple-200" />
                <h3 className="text-purple-200 text-sm font-bold">
                  رصيد المحفظة
                </h3>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight">
                  {wallet?.balance || "0.00"}
                </span>
                <span className="text-purple-200 text-base sm:text-lg font-medium">
                  ريال
                </span>
              </div>

              {isTeacher ? (
                <div className="mt-6 flex gap-2">
                  <Button asChild variant="secondary" className="flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/10 rounded-xl h-10 px-2 py-0 text-xs">
                    <Link href="/dashboard/schedule">
                      إدارة الجدول <CalendarDays className="w-3.5 h-3.5 mr-1" />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" className="flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/10 rounded-xl h-10 px-2 py-0 text-xs">
                    <Link href="/dashboard/payout">
                      طلب سحب <Banknote className="w-3.5 h-3.5 mr-1" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="mt-6">
                  <Button asChild variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/10 rounded-xl">
                    <Link href="/dashboard/top-up">
                      شحن المحفظة <Zap className="w-4 h-4 mr-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 📊 Transaction History */}
          <Card className="animate-fade-in-up-delay-2 p-6 border-gray-100/80 bg-white/80 backdrop-blur-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </span>
              آخر العمليات المالية
            </h3>
            {wallet?.transactions?.data?.length === 0 ? (
              <div className="text-center py-6">
                <Landmark className="w-10 h-10 text-gray-300 mx-auto mb-2" />
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
                        className={`w-1.5 h-8 rounded-full ${tx.type === "withdrawal" ? "bg-red-500" : "bg-emerald-500"}`}
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
                      className={`font-bold text-base ${tx.type === "withdrawal" ? "text-red-500" : "text-emerald-500"}`}
                    >
                      {tx.type === "withdrawal" ? "-" : "+"}
                      {tx.amount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* 🛟 Support Center */}
          <Card className="animate-fade-in-up-delay-2 p-6 border-gray-100/80 bg-white/80 backdrop-blur-sm">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <LifeBuoy className="w-4 h-4" />
              </span>
              مركز المساعدة
            </h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              هل تواجه مشكلة؟ فريق الدعم متاح لمساعدتك في أي وقت.
            </p>
            <Button asChild className="w-full bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-xl">
              <Link href="/dashboard/support">
                فتح تذكرة دعم فني
              </Link>
            </Button>
          </Card>
          </div>
        </div>

        {/* ============ MAIN CONTENT ============ */}
        <Card className="lg:col-span-2 animate-fade-in-up-delay p-6 border-gray-100/80 bg-white/80 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
              <span className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </span>
              سجل الحجوزات
            </h3>
          </div>

          {/* 🔔 Notifications for Teachers */}
          {isTeacher && notifications.length > 0 && (
            <div className="bg-gradient-to-l from-amber-50 to-yellow-50 border border-amber-200/60 p-5 rounded-2xl mb-6">
              <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                <span className="w-7 h-7 bg-amber-200 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-amber-700" />
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
                      className="text-xs bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-amber-700 flex items-center gap-1 transition-all duration-200 font-bold"
                    >
                      تحديد كمقروء <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bookings Content */}
          {bookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mx-auto mb-5">
                <BookOpen className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">
                ليس لديك أي حجوزات حتى الآن
              </h4>
              <p className="text-gray-400 text-sm mb-6">
                ابدأ رحلتك التعليمية بحجز حصتك الأولى مع نخبة المعلمين
              </p>
              {!isTeacher && (
                <Button asChild className="px-6 rounded-xl font-bold">
                  <Link href="/">
                    احجز حصتك الأولى <Rocket className="w-4 h-4 mr-2" />
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="bg-gradient-to-l from-gray-50/50 to-slate-50/50 border-b border-gray-100">
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider rounded-tr-2xl text-right">
                      رقم
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                      {isTeacher ? "الطالب" : "المعلم"}
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                      التاريخ والوقت
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                      المبلغ
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                      الحالة
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider rounded-tl-2xl text-right">
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
                          <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm">
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
                        <span className="font-bold text-gray-800">
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
                              className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all duration-200 text-xs font-bold flex items-center gap-1"
                            >
                              دخول الفصل <Video className="w-3.5 h-3.5" />
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
                              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 text-xs font-bold flex items-center gap-1"
                            >
                              إلغاء طارئ <XCircle className="w-3.5 h-3.5" />
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
                              className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all duration-200 text-xs font-bold flex items-center gap-1"
                            >
                              إنهاء وتحصيل <Coins className="w-3.5 h-3.5" />
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
        </Card>
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
