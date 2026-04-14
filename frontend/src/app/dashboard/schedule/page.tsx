"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { formatTimeTo12h } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import DecorativeBackground from "@/components/ui/DecorativeBackground";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { showApiError } from "@/hooks/useApiError";
import { ApiResponse, SlotsByDate, TeacherSlot } from '@/types';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, CheckCircle2, XCircle, Loader2, CalendarRange, CalendarX2, CalendarDays, Clock, LockOpen, Lock, LockKeyhole, Trash2 } from "lucide-react";

export default function TeacherSchedulePage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<SlotsByDate>({});
  const [loading, setLoading] = useState(true);

  // حالة الفورم
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchSlots();
  }, [user]);

  const fetchSlots = async () => {
    try {
      const res = await api.get<ApiResponse<SlotsByDate>>("/teacher/slots");
      setSlots(res.data.data || {});
    } catch (error) {
      console.error("خطأ في جلب الجدول", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post("/teacher/slots", {
        slot_date: date,
        start_time: startTime,
        end_time: endTime,
      });

      toast.success("تم إضافة الموعد بنجاح!");
      setStartTime(""); // تصفير الوقت لتسهيل الإضافة التالية
      setEndTime("");
      fetchSlots(); // تحديث الجدول فوراً
    } catch (error: unknown) {
      showApiError(error, "حدث خطأ غير متوقع");
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
      <div className="p-8 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-8">
              <Skeleton className="h-10 w-1/3" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Skeleton className="h-[400px] rounded-3xl" />
                  <Skeleton className="h-[600px] rounded-3xl lg:col-span-2" />
              </div>
          </div>
      </div>
    );
  if (!user?.roles?.some((r) => r.name === "teacher"))
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        هذه الصفحة للمعلمين فقط.
      </div>
    );

  // الحصول على تاريخ اليوم كحد أدنى للإدخال
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50/50 p-4 md:p-8">
      <DecorativeBackground />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8 tracking-tight">
        
        <PageHeader
          title="إدارة جدول المواعيد"
          subtitle="أضف أوقات فراغك ليتمكن الطلاب من حجز حصصهم معك بسهولة."
          backHref="/dashboard"
          backLabel="العودة للوحة التحكم"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* عمود إضافة المواعيد */}
          <Card className="lg:col-span-1 bg-white/90 backdrop-blur-md rounded-[2rem] border-white/50 animate-fade-in-up-delay p-8 h-fit">
            <h3 className="font-extrabold text-xl text-indigo-900 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Plus className="w-5 h-5" />
              </span>
              إضافة موعد جديد
            </h3>



            <form onSubmit={handleAddSlot} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">
                  تاريخ اليوم:
                </label>
                <Input
                  type="date"
                  required
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">
                    يبدأ من:
                  </label>
                  <Input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">
                    ينتهي في:
                  </label>
                  <Input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:shadow-[0_12px_40px_rgba(79,70,229,0.3)] text-lg rounded-[1.5rem]"
              >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        جاري الإضافة...
                    </>
                ) : (
                    <>
                        <span>إضافة الموعد للجدول</span>
                        <Plus className="w-5 h-5 mr-3" />
                    </>
                )}
              </Button>
            </form>
          </Card>

          {/* عمود عرض الجدول الحالي */}
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-[2.5rem] border-white/50 h-fit animate-fade-in-up-delay-2 p-8">
            <h3 className="font-extrabold text-2xl text-gray-900 mb-8 flex items-center gap-3 underline underline-offset-8 decoration-indigo-100">
               <span className="w-10 h-10 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <CalendarRange className="w-5 h-5" />
               </span>
              جدول أوقاتي المتاحة والمحجوزة
            </h3>

            {Object.keys(slots).length === 0 ? (
              <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-4 border-dashed border-gray-100 text-gray-400 font-black flex flex-col items-center gap-4">
                <CalendarX2 className="w-16 h-16 text-gray-300" />
                <span>ليس لديك أي مواعيد مضافة في المستقبل.</span>
                <p className="text-xs font-bold">ابدأ بإضافة أوقات فراغك ليتمكن الطلاب من الحجز معك.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {Object.entries(slots).map(
                  ([dayDate, daySlots]: [string, TeacherSlot[]]) => (
                    <div
                      key={dayDate}
                      className="relative bg-white/40 p-6 rounded-[2rem] border-2 border-gray-50 shadow-sm"
                    >
                      <h4 className="font-black text-gray-900 text-xl mb-6 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-2xl text-sm shadow-sm inline-flex items-center gap-2 mr-1">
                             <CalendarDays className="w-4 h-4" /> {new Date(dayDate).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {daySlots.map((slot) => (
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
                                <div className="space-y-2">
                                    <div className="font-black text-gray-900 text-base flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        {formatTimeTo12h(slot.start_time)} - {formatTimeTo12h(slot.end_time)}
                                    </div>
                                    <div
                                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                                        slot.status === "available"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : slot.status === "booked"
                                            ? "bg-indigo-100 text-indigo-700"
                                            : "bg-rose-100 text-rose-700"
                                        }`}
                                    >
                                        {slot.status === "available"
                                        ? <>متاح للطلاب <LockOpen className="w-3 h-3" /></>
                                        : slot.status === "booked"
                                            ? <>محجوز <Lock className="w-3 h-3" /></>
                                            : <>مغلق <LockKeyhole className="w-3 h-3" /></>}
                                    </div>
                                </div>

                                {slot.status === "available" && (
                                <button
                                    onClick={() => setDeleteConfirm({ isOpen: true, slotId: slot.id })}
                                    className="w-9 h-9 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all duration-200 flex items-center justify-center shadow-sm group-hover:rotate-12"
                                    title="حذف الموعد"
                                >
                                    <Trash2 className="w-4 h-4" />
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
          </Card>
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
