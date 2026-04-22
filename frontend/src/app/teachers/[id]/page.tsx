"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { User, TeacherSlot } from "@/types";
import { formatTimeTo12h } from "@/lib/utils";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { CalendarDays, CalendarX2, Gift, Users } from "lucide-react";

export default function TeacherProfile({ params }: { params: { id: string } }) {
  const [teacherName, setTeacherName] = useState("");
  const [slots, setSlots] = useState<{ [date: string]: TeacherSlot[] }>({});
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  // 🟢 حالات (States) جديدة خاصة بولي الأمر
  const [children, setChildren] = useState<User[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  const router = useRouter();
  const { user } = useAuth(); // جلب بيانات المستخدم من الـ Context

  // 🟢 التحقق مما إذا كان المستخدم ولي أمر
  const isParent = user?.roles?.some((r) => r.name === "parent");

  const fetchSlots = useCallback(async () => {
    try {
      const res = await api.get(`/discovery/teachers/${params.id}/slots`);
      setTeacherName(res.data.teacher_name);
      setSlots(res.data.data); // الأوقات مجمعة حسب التاريخ من الـ Backend
    } catch (error) {
      console.error("خطأ في جلب المواعيد", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

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
      toast.error("الرجاء اختيار الابن الذي سيحضر الحصة أولاً من القائمة أعلاه.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setBookingConfirm({ isOpen: true, slotId });
  };

  const handleBooking = async () => {
    setBookingConfirm({ isOpen: false, slotId: 0 });
    setBookingLoading(true);

    try {
      const res = await api.post("/bookings", {
        teacher_slot_id: bookingConfirm.slotId,
        promo_code: promoCode || null,
        child_id: isParent ? selectedChildId : undefined,
      });

      // تم إزالة الرسالة الثابتة هنا والاكتفاء بالتنبيه الديناميكي (Toast) بناءً على طلب المستخدم
      toast.success(res.data.message || "تم الحجز بنجاح!");
      fetchSlots();

      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "حدث خطأ غير متوقع";
      toast.error(errorMsg);
      
      const isStudent = user?.roles?.some((r) => r.name === "student");
      const isParent = user?.roles?.some((r) => r.name === "parent");
      // التحقق من نوع الخطأ
      const isPermissionError = errorMsg.includes("غير مصرح له بالحجز والدفع المباشر");
      const isBalanceError = errorMsg.includes("رصيد المحفظة غير كافٍ");
      const isPromoError = errorMsg.includes("كود الخصم المدخل غير صحيح");

      // الحالات التي نريد فيها إخفاء الرسالة الثابتة والاكتفاء بالـ Toast
      const hideStaticMessage = (isStudent && isPermissionError) || isBalanceError || isPromoError;

      if (hideStaticMessage) {
        // التوجيه التلقائي فقط في حالة سحب الصلاحية أو نقص الرصيد
        if ((isStudent && isPermissionError) || ((isStudent || isParent) && isBalanceError)) {
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        }
        // في حالة كود الخصم الخاطئ: لا نقوم بالتوجيه لكي يتمكن المستخدم من تعديله أو حذفه
      }
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading)
    return (
        <div className="p-8 min-h-screen">
             <div className="max-w-4xl mx-auto space-y-8">
                 <Skeleton className="h-32 rounded-3xl" />
                 <Skeleton className="h-24 rounded-3xl" />
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                     <Skeleton className="h-20 rounded-xl" />
                     <Skeleton className="h-20 rounded-xl" />
                     <Skeleton className="h-20 rounded-xl" />
                     <Skeleton className="h-20 rounded-xl" />
                 </div>
             </div>
        </div>
    );

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50/50">
      <Card className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-[2rem] border-white/50 animate-fade-in-up p-8">
        <div className="border-b border-gray-100 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            حجز موعد مع {teacherName}
          </h1>
          <p className="text-gray-500 mt-2 leading-relaxed">
            اختر الوقت المناسب لك من القائمة أدناه.
          </p>
        </div>



        {/* 🟢 القائمة المنسدلة لاختيار الابن (تظهر لولي الأمر فقط) */}
        {isParent && (
          <div className="mb-6 bg-indigo-50/80 p-5 rounded-2xl border border-indigo-100">
            <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" /> اختر الابن الذي سيحضر الحصة (إلزامي):
            </label>
            <div className="relative">
                <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full border-2 border-indigo-200 p-4 rounded-xl bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-bold appearance-none cursor-pointer"
                >
                <option value="">-- اضغط لاختيار الابن --</option>
                {children.map((child) => (
                    <option key={child.id} value={child.id}>
                    {child.name} (
                    {child.student_profile?.grade_level?.name || "بدون مرحلة"})
                    </option>
                ))}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">▼</div>
            </div>
          </div>
        )}

        {/* كود الخصم */}
        <div className="mb-8 bg-gradient-to-l from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-center gap-4">
          <span className="text-indigo-800 font-bold whitespace-nowrap flex items-center gap-2">
            <Gift className="w-5 h-5 text-indigo-600" /> هل لديك كود خصم؟
          </span>
          <Input
            type="text"
            placeholder="أدخل الكود هنا"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="w-full md:w-64 bg-white"
            dir="ltr"
          />
        </div>

        {/* عرض الأوقات المجمعة حسب اليوم */}
        {Object.keys(slots).length === 0 ? (
          <div className="text-center py-16 bg-gray-50/50 rounded-3xl border-4 border-dashed border-gray-100 flex flex-col items-center justify-center">
            <CalendarX2 className="w-16 h-16 text-indigo-200 mb-5" />
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              لا توجد مواعيد متاحة
            </h4>
            <p className="text-gray-400 text-sm font-bold">
              عفواً، لا توجد مواعيد متاحة حالياً لهذا المعلم.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(slots).map(([date, daySlots]) => (
              <div key={date}>
                <h3 className="text-xl font-bold mb-4 bg-gradient-to-l from-gray-50 to-slate-50 p-3 rounded-xl px-4 border-r-4 border-indigo-500 text-gray-800 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-indigo-500" /> {date}
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
      </Card>

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
