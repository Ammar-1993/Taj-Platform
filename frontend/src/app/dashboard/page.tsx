"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [wallet, setWallet] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    // حماية المسار: إذا انتهى التحميل ولم نجد مستخدماً، نوجهه لتسجيل الدخول
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // جلب بيانات المحفظة والحجوزات بالتوازي لسرعة الأداء
      const [walletRes, bookingsRes] = await Promise.all([
        api.get("/wallet"),
        api.get("/bookings"),
      ]);

      setWallet(walletRes.data.data);
      setBookings(bookingsRes.data.data.data); // .data الأولى للاستجابة والثانية للـ pagination
    } catch (error) {
      console.error("خطأ في جلب بيانات اللوحة", error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleCompleteClass = async (bookingId: number) => {
    if (
      !confirm(
        "هل أنت متأكد من إنهاء الحصة؟ سيتم إيداع الأرباح في محفظتك الآن.",
      )
    )
      return;

    try {
      const res = await api.patch(`/bookings/${bookingId}/complete`);
      alert(res.data.message);
      // تحديث اللوحة فوراً لتظهر الأرباح في المحفظة!
      fetchDashboardData();
    } catch (error: any) {
      alert(error.response?.data?.message || "حدث خطأ أثناء إنهاء الحصة");
    }
  };

  // دالة مساعدة لترجمة حالة الحجز
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <span className="px-2 py-1 text-xs rounded-md bg-blue-100 text-blue-800 font-bold">
            مجدول
          </span>
        );
      case "in_progress":
        // ✅ تمت إضافة هذه الحالة لتظهر باللون الأصفر الجميل
        return (
          <span className="px-2 py-1 text-xs rounded-md bg-yellow-100 text-yellow-800 font-bold animate-pulse">
            جارية الآن 🔴
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 text-xs rounded-md bg-green-100 text-green-800 font-bold">
            مكتمل
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-1 text-xs rounded-md bg-red-100 text-red-800 font-bold">
            ملغي
          </span>
        );
      case "refunded":
        return (
          <span className="px-2 py-1 text-xs rounded-md bg-purple-100 text-purple-800 font-bold">
            مسترجع
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-800 font-bold">
            {status}
          </span>
        );
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-bold animate-pulse text-gray-500">
        جاري تحميل لوحة التحكم...
      </div>
    );
  }

  if (!user) return null; // لتجنب وميض الصفحة قبل التوجيه

  const isTeacher = user.roles?.some((r: any) => r.name === "teacher");

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 🟢 الهيدر الترحيبي */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              مرحباً بك، {user.name} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isTeacher
                ? "بوابة المعلم لإدارة الحصص والأرباح"
                : "بوابة الطالب لإدارة الحجوزات والمحفظة"}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition"
            >
              الرئيسية
            </Link>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium transition"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 💰 قسم المحفظة */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-md text-white">
              <h3 className="text-blue-100 text-sm font-medium">
                رصيد المحفظة الحالي
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">
                  {wallet?.balance || "0.00"}
                </span>
                <span className="text-blue-200">ريال</span>
              </div>

              {isTeacher ? (
                <Link
                  href="/dashboard/payout"
                  className="mt-6 flex justify-center w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition"
                >
                  طلب سحب أرباح
                </Link>
              ) : (
                <Link
                  href="/dashboard/top-up"
                  className="mt-6 block text-center w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition"
                >
                  شحن المحفظة
                </Link>
              )}
            </div>

            {/* سجل العمليات المالية */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">
                آخر العمليات المالية
              </h3>
              {wallet?.transactions?.data?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center">
                  لا توجد عمليات سابقة
                </p>
              ) : (
                <ul className="space-y-3">
                  {wallet?.transactions?.data?.slice(0, 5).map((tx: any) => (
                    <li
                      key={tx.id}
                      className="flex justify-between items-center text-sm border-b pb-2 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {tx.type === "withdrawal" ? "خصم حجز" : "إيداع/أرباح"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`font-bold ${tx.type === "withdrawal" ? "text-red-500" : "text-green-500"}`}
                      >
                        {tx.type === "withdrawal" ? "-" : "+"}
                        {tx.amount}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 📅 قسم الحجوزات */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-900">سجل الحجوزات</h3>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">ليس لديك أي حجوزات حتى الآن.</p>
                {!isTeacher && (
                  <Link
                    href="/"
                    className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
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
                      <th className="px-4 py-3">
                        {isTeacher ? "الطالب" : "المعلم"}
                      </th>
                      <th className="px-4 py-3">التاريخ والوقت</th>
                      <th className="px-4 py-3">المبلغ</th>
                      <th className="px-4 py-3">الحالة</th>
                      <th className="px-4 py-3 rounded-tl-lg">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="px-4 py-3 font-medium">#{booking.id}</td>
                        <td className="px-4 py-3 text-gray-800 font-semibold">
                          {isTeacher
                            ? booking.student?.name
                            : booking.teacher?.name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-900">
                            {booking.booking_date.substring(0, 10)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {booking.teacher_slot?.start_time.substring(0, 5)}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-700">
                          {booking.net_paid} SAR
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(booking.status)}
                        </td>
                        <td className="px-4 py-3 flex gap-2 justify-end">
                          {/* زر دخول الفصل (يظهر للطالب والمعلم إذا كانت الحصة مجدولة أو قيد التقدم) */}
                          {(booking.status === "scheduled" ||
                            booking.status === "in_progress") && (
                            <button
                              onClick={() =>
                                router.push(`/classroom/${booking.id}`)
                              }
                              className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition text-xs font-bold border border-indigo-200"
                            >
                              دخول الفصل 📹
                            </button>
                          )}

                          {/* زر إنهاء الحصة (يظهر للمعلم فقط إذا دخل الحصة وأصبحت قيد التقدم) */}
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
      </div>
    </div>
  );
}
