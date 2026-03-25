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
  const [parentData, setParentData] = useState<any>(null); // ✅ حالة جديدة لبيانات ولي الأمر
  const [dataLoading, setDataLoading] = useState(true);


  // 🟢 حالات التقييم الإلزامي
  const [pendingReview, setPendingReview] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // تحديد دور المستخدم
  const isTeacher = user?.roles?.some((r: any) => r.name === "teacher");
  const isParent = user?.roles?.some((r: any) => r.name === "parent"); // ✅ التحقق من ولي الأمر

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
      if (isParent) {
        // ✅ جلب بيانات لوحة المراقبة الخاصة بولي الأمر
        const res = await api.get("/parent/dashboard");
        setParentData(res.data.data);
      } else {
        // جلب بيانات المحفظة والحجوزات للطالب أو المعلم بالتوازي
        const [walletRes, bookingsRes] = await Promise.all([
          api.get("/wallet"),
          api.get("/bookings"),
        ]);
        setWallet(walletRes.data.data);
        const fetchedBookings = bookingsRes.data.data.data;
        setBookings(fetchedBookings);

        // 🟢 فحص إذا كان الطالب لديه حصة مكتملة بدون تقييم (ليست للمعلم أو ولي الأمر)
        if (!isTeacher && !isParent) {
          const unreviewedBooking = fetchedBookings.find(
            (b: any) => b.status === "completed" && !b.review,
          );
          if (unreviewedBooking) {
            setPendingReview(unreviewedBooking);
          }
        }
      }
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
      fetchDashboardData();
    } catch (error: any) {
      alert(error.response?.data?.message || "حدث خطأ أثناء إنهاء الحصة");
    }
  };

  // 🟢 دالة إرسال التقييم
  const submitReview = async () => {
    setIsSubmittingReview(true);
    try {
      await api.post("/reviews", {
        booking_id: pendingReview.id,
        rating: rating,
        comment: comment,
      });
      alert("تم إرسال التقييم بنجاح! شكراً لك.");
      setPendingReview(null); // إغلاق النافذة
      fetchDashboardData(); // تحديث اللوحة
    } catch (error: any) {
      alert(error.response?.data?.message || "حدث خطأ أثناء التقييم");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <span className="px-2 py-1 text-xs rounded-md bg-blue-100 text-blue-800 font-bold">
            مجدول
          </span>
        );
      case "in_progress":
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

  if (!user) return null;

  // ==========================================
  // 🟢 1. واجهة لوحة المراقبة لولي الأمر (Parent View)
  // ==========================================
  if (isParent) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                مرحباً بك، {user.name} 👋
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                لوحة المراقبة الشاملة لحجوزات ونفقات الأبناء
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard/children"
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition"
              >
                إدارة الأبناء 👨‍👩‍👧‍👦
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-md text-white h-fit">
              
              {/* 1. رصيد ولي الأمر الأساسي وزر الشحن */}
              <h3 className="text-indigo-100 text-sm font-medium">
                رصيد المحفظة الأساسية
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">
                  {parentData?.parent_balance || "0.00"}
                </span>
                <span className="text-indigo-200">ريال</span>
              </div>
              
              <Link 
                href="/dashboard/top-up" 
                className="mt-5 flex justify-center items-center w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition"
              >
                شحن المحفظة 💳
              </Link>

              {/* 2. إجمالي الإنفاق (الاستثمار) */}
              <div className="mt-6 pt-4 border-t border-indigo-500/30">
                <h3 className="text-indigo-100 text-xs font-medium mb-1">
                  إجمالي الاستثمار في التعليم (الإنفاق)
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {parentData?.total_spent || "0.00"}
                  </span>
                  <span className="text-indigo-200 text-xs">SAR</span>
                </div>
              </div>

              {/* 3. محافظ الأبناء (مع الحفاظ على تنسيقك الجميل) */}
              <div className="mt-6 pt-4 border-t border-indigo-500/30">
                <h4 className="text-xs font-bold mb-3 opacity-80">
                  أرصدة محافظ الأبناء الحالية:
                </h4>
                {parentData?.wallets?.length === 0 ? (
                  <p className="text-xs text-indigo-200">
                    لا يوجد أبناء مضافين بعد.
                  </p>
                ) : (
                  parentData?.wallets?.map((w: any) => (
                    <div
                      key={w.id}
                      className="flex justify-between items-center text-sm mb-2 bg-indigo-900/30 p-2 rounded-lg"
                    >
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
                            
                            {/* 🟢 التعديل هنا: التحقق من وجود البيانات أولاً لتجنب خطأ null */}
                            {(!parentData?.bookings || parentData.bookings.length === 0) ? (
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
                                            {/* 🟢 إضافة علامة الاستفهام للحماية الإضافية */}
                                            {parentData?.bookings?.map((booking: any) => (
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
        </div>
      </div>
    );
  }

  // ==========================================
  // 🔵 2. الواجهة الافتراضية (للطالب أو المعلم)
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
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

            {/* 🟢 التحديث الجديد: زر إكمال الملف الشخصي يظهر للمعلم فقط */}
            {isTeacher && (
              <Link
                href="/dashboard/profile"
                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm font-bold transition flex items-center gap-1"
              >
                إكمال الملف الشخصي 📝
              </Link>
            )}

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
                          {tx.type === "withdrawal"
                            ? "خصم حجز/تجميد"
                            : "إيداع/أرباح"}
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

      {/* 🟢 النافذة المنبثقة الإلزامية للتقييم */}
      {pendingReview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative animate-fade-in-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                ⭐
              </div>
              <h2 className="text-2xl font-bold text-gray-900">كيف كانت حصتك؟</h2>
              <p className="text-gray-500 mt-2">
                يرجى تقييم حصتك مع الأستاذ{" "}
                <span className="font-bold text-blue-600">
                  {pendingReview.teacher?.name}
                </span>{" "}
                لتتمكن من متابعة تصفح لوحة التحكم.
              </p>
            </div>

            {/* النجوم */}
            <div className="flex justify-center gap-2 mb-6 cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-4xl transition transform hover:scale-110 ${rating >= star ? "text-yellow-400" : "text-gray-200"}`}
                >
                  ★
                </span>
              ))}
            </div>

            <textarea
              placeholder="اكتب تعليقك هنا (اختياري)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl p-3 mb-6 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
            />

            <button
              onClick={submitReview}
              disabled={isSubmittingReview}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isSubmittingReview ? "جاري الإرسال..." : "إرسال التقييم"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
