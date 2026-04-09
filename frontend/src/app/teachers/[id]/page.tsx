"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { User, TeacherSlot } from "@/types";
import { formatTimeTo12h } from "@/lib/utils";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
// import { showApiError } from "@/hooks/useApiError";

export default function TeacherProfile({ params }: { params: { id: string } }) {
  const [teacherName, setTeacherName] = useState("");
  const [slots, setSlots] = useState<{ [date: string]: TeacherSlot[] }>({});
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // 🟢 حالات (States) جديدة خاصة بولي الأمر
  const [children, setChildren] = useState<User[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  const router = useRouter();
  const { user } = useAuth(); // جلب بيانات المستخدم من الـ Context

  // 🟢 التحقق مما إذا كان المستخدم ولي أمر
  const isParent = user?.roles?.some((r) => r.name === "parent");

  useEffect(() => {
    fetchSlots();
  }, []);

  // 🟢 جلب أبناء ولي الأمر إذا كان المستخدم أباً
  useEffect(() => {
    if (isParent) {
      api
        .get("/parent/children")
        .then((res) => setChildren(res.data.data))
        .catch((err) =>
          console.error("حدث خطأ في استدعاء بيانات الأبناء", err),
        );
    }
  }, [isParent]);

  const fetchSlots = async () => {
    try {
      const res = await api.get(`/discovery/teachers/${params.id}/slots`);
      setTeacherName(res.data.teacher_name);
      setSlots(res.data.data); // الأوقات مجمعة حسب التاريخ من الـ Backend
    } catch (error) {
      console.error("خطأ في جلب المواعيد", error);
    } finally {
      setLoading(false);
    }
  };

  // حالة مربع تأكيد الحجز
  const [bookingConfirm, setBookingConfirm] = useState<{ isOpen: boolean; slotId: number }>({
    isOpen: false,
    slotId: 0,
  });

  const handleBookingRequest = (slotId: number) => {
    // التحقق من تسجيل الدخول أولاً
    if (!user) {
      toast.error("يجب عليك تسجيل الدخول أولاً لإتمام الحجز.");
      router.push("/login");
      return;
    }

    // تحقق أمني: إذا كان أباً ولم يختر ابناً
    if (isParent && !selectedChildId) {
      setMessage({
        type: "error",
        text: "الرجاء اختيار الابن الذي سيحضر الحصة أولاً من القائمة أعلاه.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setBookingConfirm({ isOpen: true, slotId });
  };

  const handleBooking = async () => {
    setBookingConfirm({ isOpen: false, slotId: 0 });
    setBookingLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await api.post("/bookings", {
        teacher_slot_id: bookingConfirm.slotId,
        promo_code: promoCode || null,
        child_id: isParent ? selectedChildId : undefined,
      });

      setMessage({ type: "success", text: res.data.message });
      toast.success(res.data.message || "تم الحجز بنجاح!");
      fetchSlots();

      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "حدث خطأ غير متوقع";
      setMessage({ type: "error", text: errorMsg });
      toast.error(errorMsg);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-bold animate-pulse text-gray-400">
        جاري تحميل المواعيد...
      </div>
    );

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100/80 animate-fade-in-up">
        <div className="border-b border-gray-100 pb-6 mb-6">
          <h1 className="text-3xl font-black text-gray-900">
            حجز موعد مع {teacherName}
          </h1>
          <p className="text-gray-500 mt-2 leading-relaxed">
            اختر الوقت المناسب لك من القائمة أدناه.
          </p>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-2xl mb-6 text-white font-bold text-center ${message.type === "success" ? "bg-gradient-to-l from-emerald-500 to-green-500" : "bg-gradient-to-l from-red-500 to-rose-500"} shadow-lg`}
          >
            {message.text}
          </div>
        )}

        {/* 🟢 القائمة المنسدلة لاختيار الابن (تظهر لولي الأمر فقط) */}
        {isParent && (
          <div className="mb-6 bg-indigo-50/80 p-5 rounded-2xl border border-indigo-100">
            <label className="block text-sm font-extrabold text-indigo-900 mb-2">
              👨‍👦 اختر الابن الذي سيحضر الحصة (إلزامي):
            </label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full border-2 border-indigo-200 p-3 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-200"
            >
              <option value="">-- اضغط لاختيار الابن --</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name} (
                  {child.student_profile?.grade_level?.name || "بدون مرحلة"})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* كود الخصم */}
        <div className="mb-8 bg-gradient-to-l from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-center gap-4">
          <span className="text-indigo-800 font-extrabold whitespace-nowrap">
            🎁 هل لديك كود خصم؟
          </span>
          <input
            type="text"
            placeholder="أدخل الكود هنا"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="px-4 py-2.5 border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-auto transition-all duration-200 bg-white"
            dir="ltr"
          />
        </div>

        {/* عرض الأوقات المجمعة حسب اليوم */}
        {Object.keys(slots).length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">
              📅
            </div>
            <h4 className="text-xl font-extrabold text-gray-800 mb-2">
              لا توجد مواعيد متاحة
            </h4>
            <p className="text-gray-400 text-sm">
              عفواً، لا توجد مواعيد متاحة حالياً لهذا المعلم.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(slots).map(([date, daySlots]) => (
              <div key={date}>
                <h3 className="text-xl font-extrabold mb-4 bg-gradient-to-l from-gray-50 to-slate-50 p-3 rounded-xl px-4 border-r-4 border-indigo-500 text-gray-800">
                  🗓️ {date}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {daySlots.map((slot: TeacherSlot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleBookingRequest(slot.id)}
                      disabled={bookingLoading}
                      className="border-2 border-indigo-100 hover:border-indigo-500 bg-white hover:bg-indigo-50 text-indigo-900 font-bold py-3 px-4 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 disabled:opacity-50 hover:shadow-md hover:-translate-y-0.5"
                    >
                      <span>{formatTimeTo12h(slot.start_time)}</span>
                      <span className="text-xs text-gray-500">
                        إلى {formatTimeTo12h(slot.end_time)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={bookingConfirm.isOpen}
        title="تأكيد الحجز"
        message="هل أنت متأكد من حجز هذا الموعد؟ سيتم خصم المبلغ من محفظتك."
        confirmText="تأكيد الحجز"
        variant="info"
        isLoading={bookingLoading}
        onConfirm={handleBooking}
        onCancel={() => setBookingConfirm({ isOpen: false, slotId: 0 })}
      />
    </div>
  );
}
