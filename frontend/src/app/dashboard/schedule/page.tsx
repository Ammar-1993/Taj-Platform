"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import Link from "next/link";
import { formatTimeTo12h } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { showApiError } from "@/hooks/useApiError";

export default function TeacherSchedulePage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // حالة الفورم
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (user) fetchSlots();
  }, [user]);

  const fetchSlots = async () => {
    try {
      const res = await api.get("/teacher/slots");
      setSlots(res.data.data);
    } catch (error) {
      console.error("خطأ في جلب الجدول", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await api.post("/teacher/slots", {
        slot_date: date,
        start_time: startTime,
        end_time: endTime,
      });

      setMessage({ type: "success", text: "تم إضافة الموعد بنجاح! ✅" });
      setStartTime(""); // تصفير الوقت لتسهيل الإضافة التالية
      setEndTime("");
      fetchSlots(); // تحديث الجدول فوراً
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "حدث خطأ غير متوقع",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; slotId: number }>({ isOpen: false, slotId: 0 });

  const handleDeleteSlot = async () => {
    try {
      await api.delete(`/teacher/slots/${deleteConfirm.slotId}`);
      toast.success("تم حذف الموعد بنجاح.");
      fetchSlots();
    } catch (error: unknown) {
      showApiError(error, "لا يمكن حذف الموعد.");
    } finally {
      setDeleteConfirm({ isOpen: false, slotId: 0 });
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center animate-pulse font-bold">
        جاري تحميل الجدول...
      </div>
    );
  if (!user?.roles?.some((r: any) => r.name === "teacher"))
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        هذه الصفحة للمعلمين فقط.
      </div>
    );

  // الحصول على تاريخ اليوم كحد أدنى للإدخال
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50/50 p-4 md:p-8">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-0 opacity-20">
        <div className="absolute top-[10%] -left-20 w-96 h-96 rounded-full bg-indigo-300 blur-[120px]"></div>
        <div className="absolute bottom-[20%] -right-20 w-[600px] h-[600px] rounded-full bg-purple-200 blur-[150px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8 tracking-tight">
        
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up">
            <div>
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                    <span className="text-4xl animate-subtle-pulse">📅</span>
                    إدارة جدول المواعيد
                </h1>
                <p className="text-gray-500 text-sm mt-2 font-medium">أضف أوقات فراغك ليتمكن الطلاب من حجز حصصهم معك بسهولة.</p>
            </div>
            <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5"
            >
                <span>العودة للوحة التحكم</span>
                <span>🏠</span>
            </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* عمود إضافة المواعيد */}
          <div className="lg:col-span-1 bg-white/90 backdrop-blur-md p-8 rounded-[2rem] shadow-xl border border-white/50 h-fit animate-fade-in-up-delay">
            <h3 className="font-extrabold text-xl text-indigo-900 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-lg shadow-inner">
                ➕
              </span>
              إضافة موعد جديد
            </h3>

            {message.text && (
              <div
                className={`p-4 mb-6 rounded-2xl text-sm font-bold shadow-sm animate-bounce-subtle ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}
              >
                {message.type === "success" ? "✅ " : "❌ "}{message.text}
              </div>
            )}

            <form onSubmit={handleAddSlot} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">
                  تاريخ اليوم:
                </label>
                <input
                  type="date"
                  required
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-50/50 border-2 border-gray-100 p-4 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-bold text-gray-700"
                />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">
                    يبدأ من:
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-gray-50/50 border-2 border-gray-100 p-4 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-bold text-gray-700"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">
                    ينتهي في:
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-gray-50/50 border-2 border-gray-100 p-4 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 font-bold text-gray-700"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white font-black py-4.5 rounded-[1.5rem] hover:shadow-[0_12px_40px_rgba(79,70,229,0.3)] transition-all duration-300 disabled:opacity-50 mt-2 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 shadow-xl"
              >
                {isSubmitting ? (
                    <>
                        <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                        جاري الإضافة...
                    </>
                ) : (
                    <>
                        <span>إضافة الموعد للجدول</span>
                        <span>➕</span>
                    </>
                )}
              </button>
            </form>
          </div>

          {/* عمود عرض الجدول الحالي */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-xl border border-white/50 h-fit animate-fade-in-up-delay-2">
            <h3 className="font-extrabold text-2xl text-gray-900 mb-8 flex items-center gap-3 underline underline-offset-8 decoration-indigo-100">
               <span className="w-10 h-10 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-lg shadow-inner">
                    🗓️
               </span>
              جدول أوقاتي المتاحة والمحجوزة
            </h3>

            {Object.keys(slots).length === 0 ? (
              <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-4 border-dashed border-gray-100 text-gray-400 font-black flex flex-col items-center gap-4">
                <div className="text-7xl opacity-20">📅</div>
                <span>ليس لديك أي مواعيد مضافة في المستقبل.</span>
                <p className="text-xs font-bold">ابدأ بإضافة أوقات فراغك ليتمكن الطلاب من الحجز معك.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {Object.entries(slots).map(
                  ([dayDate, daySlots]: [string, any]) => (
                    <div
                      key={dayDate}
                      className="relative bg-white/40 p-6 rounded-[2rem] border-2 border-gray-50 shadow-sm"
                    >
                      <h4 className="font-black text-gray-900 text-xl mb-6 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-2xl text-sm shadow-sm inline-block mr-1">
                             📅 {new Date(dayDate).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {daySlots.map((slot: any) => (
                          <div
                            key={slot.id}
                            className={`group relative overflow-hidden backdrop-blur-sm p-4.5 rounded-[1.5rem] border-2 flex flex-col gap-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                              slot.status === "available"
                                ? "border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50"
                                : slot.status === "booked"
                                  ? "border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50"
                                  : "border-rose-100 bg-rose-50/40 hover:bg-rose-50"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="font-black text-gray-900 text-base flex items-center gap-1.5">
                                        <span className="text-lg">🕒</span>
                                        {formatTimeTo12h(slot.start_time)} - {formatTimeTo12h(slot.end_time)}
                                    </div>
                                    <div
                                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
                                        slot.status === "available"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : slot.status === "booked"
                                            ? "bg-indigo-100 text-indigo-700"
                                            : "bg-rose-100 text-rose-700"
                                        }`}
                                    >
                                        {slot.status === "available"
                                        ? "متاح للطلاب 🔓"
                                        : slot.status === "booked"
                                            ? "محجوز 🔒"
                                            : "مغلق"}
                                    </div>
                                </div>

                                {slot.status === "available" && (
                                <button
                                    onClick={() => setDeleteConfirm({ isOpen: true, slotId: slot.id })}
                                    className="w-9 h-9 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all duration-200 flex items-center justify-center shadow-sm group-hover:rotate-12"
                                    title="حذف الموعد"
                                >
                                    <span className="text-lg">🗑️</span>
                                </button>
                                )}
                            </div>
                            
                            {/* Simple visual indicator at bottom of card */}
                            <div className={`mt-1 h-1.5 w-full rounded-full opacity-30 ${
                                slot.status === "available" ? "bg-emerald-400" : slot.status === "booked" ? "bg-indigo-400" : "bg-rose-400"
                            }`}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="حذف الموعد"
        message="هل أنت متأكد من حذف هذا الموعد؟ لن يمكن التراجع عن هذا الإجراء."
        confirmText="حذف الموعد"
        variant="danger"
        onConfirm={handleDeleteSlot}
        onCancel={() => setDeleteConfirm({ isOpen: false, slotId: 0 })}
      />
    </div>
  );
}
