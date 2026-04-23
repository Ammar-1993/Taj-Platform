"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { User, TeacherSlot } from "@/types";
import { formatTimeTo12h } from "@/lib/utils";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { CalendarDays, CalendarX2, Gift, Users, Clock, Loader2, CircleDollarSign } from "lucide-react";

export default function TeacherProfile({ params }: { params: { id: string } }) {
  const [teacherName, setTeacherName] = useState("");
  const [sessionPrice, setSessionPrice] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ [date: string]: TeacherSlot[] }>({});
  const [activeDate, setActiveDate] = useState<string>("");
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Parent specific states
  const [children, setChildren] = useState<User[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  const router = useRouter();
  const { user } = useAuth();

  const isParent = user?.roles?.some((r) => r.name === "parent");

  const fetchSlots = useCallback(async () => {
    try {
      const res = await api.get(`/discovery/teachers/${params.id}/slots`);
      setTeacherName(res.data.teacher_name);
      if (res.data.session_price) setSessionPrice(res.data.session_price);
      setSlots(res.data.data);
      const dates = Object.keys(res.data.data);
      if (dates.length > 0) {
          setActiveDate(dates[0]);
      }
    } catch (error) {
      console.error("خطأ في جلب المواعيد", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

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

  // Booking Modal State
  const [bookingModal, setBookingModal] = useState<{ isOpen: boolean; slot: TeacherSlot | null }>({
    isOpen: false,
    slot: null,
  });

  const handleBookingRequest = (slot: TeacherSlot) => {
    if (!user) {
      toast.error("يجب عليك تسجيل الدخول أولاً لإتمام الحجز.");
      router.push("/login");
      return;
    }
    setBookingModal({ isOpen: true, slot });
  };

  const handleBooking = async () => {
    if (isParent && !selectedChildId) return;

    setBookingLoading(true);

    try {
      const res = await api.post("/bookings", {
        teacher_slot_id: bookingModal.slot?.id,
        promo_code: promoCode || null,
        child_id: isParent ? selectedChildId : undefined,
      });

      toast.success(res.data.message || "تم الحجز بنجاح!");
      setBookingModal({ isOpen: false, slot: null });
      fetchSlots();

      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "حدث خطأ غير متوقع";
      toast.error(errorMsg);
      
      const isStudent = user?.roles?.some((r) => r.name === "student");
      const isBalanceError = errorMsg.includes("رصيد المحفظة غير كافٍ");
      const isPermissionError = errorMsg.includes("غير مصرح له بالحجز والدفع المباشر");
      const isPromoError = errorMsg.includes("كود الخصم المدخل غير صحيح");

      const hideStaticMessage = (isStudent && isPermissionError) || isBalanceError || isPromoError;

      if (hideStaticMessage) {
        if ((isStudent && isPermissionError) || ((isStudent || isParent) && isBalanceError)) {
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        }
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

  const activeDaySlots = slots[activeDate] || [];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <Card className="max-w-4xl mx-auto rounded-2xl p-6 md:p-8">
        <div className="border-b border-gray-100 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            حجز موعد مع {teacherName}
          </h1>
          <p className="text-gray-500 mt-2 leading-relaxed">
            اختر اليوم المناسب لك من الشريط الزمني ثم حدد الوقت المتاح.
          </p>
        </div>

        {Object.keys(slots).length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
            <CalendarX2 className="w-16 h-16 text-indigo-200 mb-5" />
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              لا توجد مواعيد متاحة
            </h4>
            <p className="text-gray-400 text-sm">
              عفواً، لا توجد مواعيد متاحة حالياً لهذا المعلم.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Date Carousel */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {Object.keys(slots).map((date) => (
                <button
                  key={date}
                  onClick={() => setActiveDate(date)}
                  className={`flex-shrink-0 min-w-[120px] p-4 rounded-xl border-2 font-bold transition-all ${
                    activeDate === date 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-gray-100 bg-white text-gray-600 hover:border-indigo-200 hover:bg-gray-50'
                  }`}
                >
                  <CalendarDays className="w-5 h-5 mx-auto mb-2" />
                  <span className="block text-sm">{date}</span>
                </button>
              ))}
            </div>

            {/* Time Slots Grid */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" /> الأوقات المتاحة ليوم {activeDate}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {activeDaySlots.map((slot: TeacherSlot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleBookingRequest(slot)}
                      className="border border-gray-200 hover:border-indigo-500 bg-white hover:bg-indigo-50 text-indigo-900 font-bold py-3 px-4 rounded-lg transition-all flex flex-col items-center justify-center gap-1 active:scale-95"
                    >
                      <span className="text-base">{formatTimeTo12h(slot.start_time)}</span>
                      <span className="text-xs text-gray-500 font-normal">
                        إلى {formatTimeTo12h(slot.end_time)}
                      </span>
                    </button>
                  ))}
                </div>
            </div>
          </div>
        )}
      </Card>

      {/* Unified Booking Modal */}
      {bookingModal.isOpen && bookingModal.slot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">تأكيد الحجز</h3>
              <p className="text-gray-500 text-sm">
                ستقوم بحجز الموعد من <span className="font-bold text-indigo-600">{formatTimeTo12h(bookingModal.slot.start_time)}</span> إلى <span className="font-bold text-indigo-600">{formatTimeTo12h(bookingModal.slot.end_time)}</span>
              </p>
            </div>

            <div className="space-y-5">
                {isParent && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" /> اختر الابن (إلزامي):
                    </label>
                    <select
                        value={selectedChildId}
                        onChange={(e) => setSelectedChildId(e.target.value)}
                        className="w-full border border-gray-200 p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-bold"
                    >
                        <option value="">-- اضغط لاختيار الابن --</option>
                        {children.map((child) => (
                            <option key={child.id} value={child.id}>
                            {child.name}
                            </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Gift className="w-4 h-4" /> كود الخصم (اختياري):
                    </label>
                    <Input
                        type="text"
                        placeholder="أدخل الكود هنا"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="w-full"
                        dir="ltr"
                    />
                </div>

                {/* Price summary — P0-03 fix */}
                {sessionPrice && (
                  <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                    <span className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                      <CircleDollarSign className="w-4 h-4" />
                      سعر الحصة
                    </span>
                    <span className="font-mono font-bold text-indigo-800 text-base" dir="ltr">
                      {sessionPrice} ريال
                    </span>
                  </div>
                )}
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                variant="secondary"
                onClick={() => setBookingModal({ isOpen: false, slot: null })}
                disabled={bookingLoading}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleBooking}
                disabled={bookingLoading || (isParent && !selectedChildId)}
                className="flex-1"
              >
                {bookingLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "تأكيد ودفع"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
